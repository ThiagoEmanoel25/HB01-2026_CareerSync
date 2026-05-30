import ast
import json
import subprocess
import sys
from uuid import uuid4
from dataclasses import dataclass
from pathlib import Path

from fastapi import HTTPException

from core.config import settings
from services.challenges.catalog import Challenge, TestCase


FORBIDDEN_MODULES = {
    "os",
    "sys",
    "subprocess",
    "socket",
    "pathlib",
    "shutil",
}

FORBIDDEN_CALLS = {
    "__import__",
    "breakpoint",
    "compile",
    "delattr",
    "dir",
    "eval",
    "exec",
    "getattr",
    "globals",
    "input",
    "locals",
    "open",
    "setattr",
    "vars",
}


@dataclass(frozen=True)
class TestFailure:
    input: dict
    expected: object
    actual: object


@dataclass(frozen=True)
class RunResult:
    passed: bool
    status: str
    total_tests: int
    passed_count: int
    first_failure: TestFailure | None = None
    error: str | None = None


class LocalPythonSubprocessRunner:
    def run(self, code: str, challenge: Challenge) -> RunResult:
        self._validate_configuration()
        self._validate_code_size(code)
        self._validate_ast(code)

        temp_root = Path(__file__).resolve().parents[2] / ".runner_tmp"
        temp_root.mkdir(parents=True, exist_ok=True)

        run_id = str(uuid4())
        result_path = temp_root / f"{run_id}.result.json"
        script_path = temp_root / f"{run_id}.runner.py"
        script_path.write_text(self._build_script(code, challenge, result_path), encoding="utf-8")

        try:
            try:
                completed = subprocess.run(
                    [sys.executable, str(script_path)],
                    cwd=str(temp_root),
                    capture_output=True,
                    text=True,
                    timeout=settings.code_runner_timeout_seconds,
                )
            except subprocess.TimeoutExpired:
                return RunResult(
                    passed=False,
                    status="timeout",
                    total_tests=len(challenge.test_cases),
                    passed_count=0,
                    error="Tempo limite excedido. Verifique loops infinitos ou complexidade muito alta.",
                )

            if not result_path.exists():
                error = (completed.stderr or completed.stdout or "Runner não retornou resultado.").strip()
                return RunResult(
                    passed=False,
                    status="error",
                    total_tests=len(challenge.test_cases),
                    passed_count=0,
                    error=self._truncate(error),
                )

            try:
                payload = json.loads(result_path.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                return RunResult(
                    passed=False,
                    status="error",
                    total_tests=len(challenge.test_cases),
                    passed_count=0,
                    error="Resultado interno do runner inválido.",
                )
        finally:
            script_path.unlink(missing_ok=True)
            result_path.unlink(missing_ok=True)

        if payload.get("status") == "error":
            return RunResult(
                passed=False,
                status="error",
                total_tests=len(challenge.test_cases),
                passed_count=0,
                error=self._truncate(str(payload.get("error", "Erro ao executar solução."))),
            )

        results = payload.get("results", [])
        passed_count = 0
        first_failure: TestFailure | None = None

        for test_case, actual in zip(challenge.test_cases, results, strict=False):
            if self._matches(challenge, test_case, actual):
                passed_count += 1
                continue
            if first_failure is None:
                first_failure = TestFailure(
                    input=test_case.input,
                    expected=test_case.expected,
                    actual=actual,
                )

        total_tests = len(challenge.test_cases)
        passed = passed_count == total_tests
        return RunResult(
            passed=passed,
            status="passed" if passed else "failed",
            total_tests=total_tests,
            passed_count=passed_count,
            first_failure=first_failure,
        )

    def _validate_configuration(self) -> None:
        if settings.environment == "production" and settings.code_runner == "local":
            raise HTTPException(
                status_code=503,
                detail="LocalPythonSubprocessRunner não pode ser usado em produção.",
            )
        if settings.code_runner != "local":
            raise HTTPException(status_code=503, detail="Runner de código não configurado.")

    def _validate_code_size(self, code: str) -> None:
        if len(code.encode("utf-8")) > settings.max_code_bytes:
            raise HTTPException(status_code=413, detail="Código excede o tamanho máximo permitido.")

    def _validate_ast(self, code: str) -> None:
        try:
            tree = ast.parse(code)
        except SyntaxError as exc:
            raise HTTPException(status_code=400, detail=f"Python inválido: {exc.msg}.") from exc

        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    self._reject_module(alias.name)
            elif isinstance(node, ast.ImportFrom):
                self._reject_module(node.module or "")
            elif isinstance(node, ast.Call):
                name = self._call_name(node.func)
                if name in FORBIDDEN_CALLS:
                    raise HTTPException(status_code=400, detail=f"Uso de '{name}' não permitido.")

    def _reject_module(self, module: str) -> None:
        root = module.split(".", 1)[0]
        if root in FORBIDDEN_MODULES:
            raise HTTPException(status_code=400, detail=f"Import de '{root}' não permitido.")

    def _call_name(self, node: ast.AST) -> str | None:
        if isinstance(node, ast.Name):
            return node.id
        if isinstance(node, ast.Attribute):
            return node.attr
        return None

    def _matches(self, challenge: Challenge, test_case: TestCase, actual: object) -> bool:
        if challenge.comparator == "two_sum":
            return self._matches_two_sum(test_case.input["nums"], test_case.input["target"], actual, one_indexed=False)
        if challenge.comparator == "two_sum_sorted":
            return self._matches_two_sum(test_case.input["numbers"], test_case.input["target"], actual, one_indexed=True)
        return actual == test_case.expected

    def _matches_two_sum(self, nums: list[int], target: int, actual: object, one_indexed: bool) -> bool:
        if not isinstance(actual, list) or len(actual) != 2:
            return False
        if not all(isinstance(index, int) for index in actual):
            return False

        left, right = actual
        if one_indexed:
            left -= 1
            right -= 1

        if left == right:
            return False
        if left < 0 or right < 0 or left >= len(nums) or right >= len(nums):
            return False
        return nums[left] + nums[right] == target

    def _truncate(self, value: str) -> str:
        encoded = value.encode("utf-8")
        if len(encoded) <= settings.max_runner_output_bytes:
            return value
        return encoded[: settings.max_runner_output_bytes].decode("utf-8", errors="ignore") + "\n[output truncated]"

    def _build_script(self, code: str, challenge: Challenge, result_path: Path) -> str:
        test_cases = [test_case.input for test_case in challenge.test_cases]
        payload = {
            "code": code,
            "function_name": challenge.function_name,
            "parameter_order": challenge.parameter_order,
            "input_transforms": challenge.input_transforms or {},
            "output_transform": challenge.output_transform,
            "test_inputs": test_cases,
            "result_path": str(result_path),
            "max_output_bytes": settings.max_runner_output_bytes,
        }
        payload_json = json.dumps(payload)
        return f"""
import contextlib
import io
import json
import traceback

PAYLOAD = json.loads({payload_json!r})


class LimitedWriter(io.StringIO):
    def __init__(self, limit):
        super().__init__()
        self.limit = limit
        self.size = 0

    def write(self, value):
        self.size += len(value.encode("utf-8", errors="ignore"))
        if self.size > self.limit:
            raise RuntimeError("Saida do usuario excede o limite permitido.")
        return super().write(value)


class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


def build_list(values):
    dummy = ListNode()
    current = dummy
    for value in values:
        current.next = ListNode(value)
        current = current.next
    return dummy.next


def list_to_array(head):
    values = []
    current = head
    seen = 0
    while current is not None:
        values.append(current.val)
        current = current.next
        seen += 1
        if seen > 10000:
            raise RuntimeError("Lista encadeada parece conter ciclo.")
    return values


def convert_input(name, value):
    if PAYLOAD["input_transforms"].get(name) == "list_node":
        return build_list(value)
    return value


def convert_output(value):
    if PAYLOAD["output_transform"] == "list_node":
        return list_to_array(value)
    return value


def write_result(payload):
    with open(PAYLOAD["result_path"], "w", encoding="utf-8") as result_file:
        json.dump(payload, result_file)


stdout = LimitedWriter(PAYLOAD["max_output_bytes"])
stderr = LimitedWriter(PAYLOAD["max_output_bytes"])

try:
    namespace = {{"ListNode": ListNode}}
    with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
        exec(compile(PAYLOAD["code"], "<user_solution>", "exec"), namespace)
        fn = namespace.get(PAYLOAD["function_name"])
        if not callable(fn):
            raise NameError(f"Funcao obrigatoria '{{PAYLOAD['function_name']}}' nao encontrada.")

        results = []
        for test_input in PAYLOAD["test_inputs"]:
            args = [
                convert_input(name, test_input[name])
                for name in PAYLOAD["parameter_order"]
            ]
            results.append(convert_output(fn(*args)))

    write_result({{"status": "ok", "results": results}})
except Exception as exc:
    write_result({{
        "status": "error",
        "error": str(exc),
        "traceback": traceback.format_exc(limit=3),
    }})
"""
