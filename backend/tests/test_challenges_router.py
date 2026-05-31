import os
import unittest
from collections import Counter

os.environ.setdefault("OPENAI_API_KEY", "test-key")
os.environ.setdefault("DATABASE_URL", "sqlite://")

from fastapi import FastAPI
from fastapi.testclient import TestClient

from core.config import settings
from routers.challenges import router
from services.llm_service import LLMService


class FakeLLMService:
    def __init__(self) -> None:
        self.calls = []

    async def generate_challenge_hint(self, challenge, code: str) -> str:
        self.calls.append((challenge.slug, code))
        return "Voce esta no caminho certo, mas revise os casos de borda sem mudar a assinatura."


class ChallengesRouterTest(unittest.TestCase):
    def setUp(self) -> None:
        self.original_environment = settings.environment
        self.original_code_runner = settings.code_runner

        settings.environment = "development"
        settings.code_runner = "local"

        self.fake_llm = FakeLLMService()
        app = FastAPI()
        app.include_router(router)
        app.dependency_overrides[LLMService] = lambda: self.fake_llm
        self.client = TestClient(app)

    def tearDown(self) -> None:
        settings.environment = self.original_environment
        settings.code_runner = self.original_code_runner

    def test_catalog_has_required_distribution_and_no_hidden_tests(self) -> None:
        response = self.client.get("/challenges")

        self.assertEqual(response.status_code, 200)
        challenges = response.json()
        self.assertEqual(len(challenges), 8)
        self.assertEqual(
            Counter(challenge["category"] for challenge in challenges),
            Counter({
                "Array": 2,
                "Two Pointer": 2,
                "Hashmap": 1,
                "Sliding Window": 1,
                "Linked List": 2,
            }),
        )
        self.assertTrue(all("test_cases" not in challenge for challenge in challenges))

        detail_response = self.client.get("/challenges/two-sum")
        self.assertEqual(detail_response.status_code, 200)
        detail = detail_response.json()
        self.assertEqual(detail["slug"], "two-sum")
        self.assertIn("def two_sum(nums, target):", detail["signature"])
        self.assertNotIn("test_cases", detail)

    def test_submit_correct_solution_passes(self) -> None:
        response = self.client.post(
            "/challenges/best-time-to-buy-and-sell-stock/submit",
            json={
                "code": "\n".join([
                    "def max_profit(prices):",
                    "    best = 0",
                    "    low = prices[0] if prices else 0",
                    "    for price in prices:",
                    "        low = min(low, price)",
                    "        best = max(best, price - low)",
                    "    return best",
                ])
            },
        )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertTrue(body["passed"])
        self.assertEqual(body["passed_count"], body["total_tests"])
        self.assertIsNone(body["first_failure"])

    def test_submit_incorrect_solution_shows_only_first_failure_details(self) -> None:
        response = self.client.post(
            "/challenges/best-time-to-buy-and-sell-stock/submit",
            json={"code": "def max_profit(prices):\n    return 0"},
        )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertFalse(body["passed"])
        self.assertLess(body["passed_count"], body["total_tests"])
        self.assertIsNotNone(body["first_failure"])
        self.assertIn("input", body["first_failure"])
        self.assertIn("expected", body["first_failure"])
        self.assertIn("actual", body["first_failure"])
        self.assertNotIn("failures", body)

    def test_two_sum_accepts_reversed_index_order(self) -> None:
        response = self.client.post(
            "/challenges/two-sum/submit",
            json={
                "code": "\n".join([
                    "def two_sum(nums, target):",
                    "    for i in range(len(nums)):",
                    "        for j in range(i + 1, len(nums)):",
                    "            if nums[i] + nums[j] == target:",
                    "                return [j, i]",
                ])
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["passed"])

    def test_two_sum_ii_requires_one_indexed_positions(self) -> None:
        zero_indexed_response = self.client.post(
            "/challenges/two-sum-ii-input-array-is-sorted/submit",
            json={"code": "def two_sum_sorted(numbers, target):\n    return [0, 1]"},
        )
        self.assertEqual(zero_indexed_response.status_code, 200)
        self.assertFalse(zero_indexed_response.json()["passed"])

        one_indexed_response = self.client.post(
            "/challenges/two-sum-ii-input-array-is-sorted/submit",
            json={
                "code": "\n".join([
                    "def two_sum_sorted(numbers, target):",
                    "    left, right = 0, len(numbers) - 1",
                    "    while left < right:",
                    "        current = numbers[left] + numbers[right]",
                    "        if current == target:",
                    "            return [left + 1, right + 1]",
                    "        if current < target:",
                    "            left += 1",
                    "        else:",
                    "            right -= 1",
                ])
            },
        )
        self.assertEqual(one_indexed_response.status_code, 200)
        self.assertTrue(one_indexed_response.json()["passed"])

    def test_linked_list_return_is_serialized_for_comparison(self) -> None:
        response = self.client.post(
            "/challenges/reverse-linked-list/submit",
            json={
                "code": "\n".join([
                    "def reverse_list(head):",
                    "    prev = None",
                    "    current = head",
                    "    while current:",
                    "        nxt = current.next",
                    "        current.next = prev",
                    "        prev = current",
                    "        current = nxt",
                    "    return prev",
                ])
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["passed"])

    def test_runner_timeout_is_controlled(self) -> None:
        response = self.client.post(
            "/challenges/two-sum/submit",
            json={"code": "def two_sum(nums, target):\n    while True:\n        pass"},
        )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertFalse(body["passed"])
        self.assertEqual(body["status"], "timeout")

    def test_user_print_does_not_corrupt_runner_result(self) -> None:
        response = self.client.post(
            "/challenges/two-sum/submit",
            json={
                "code": "\n".join([
                    "def two_sum(nums, target):",
                    "    print('debug')",
                    "    seen = {}",
                    "    for i, value in enumerate(nums):",
                    "        if target - value in seen:",
                    "            return [i, seen[target - value]]",
                    "        seen[value] = i",
                ])
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["passed"])

    def test_rejects_oversized_and_forbidden_code(self) -> None:
        oversized = self.client.post(
            "/challenges/two-sum/submit",
            json={"code": "def two_sum(nums, target):\n    return []\n" + ("#" * 10001)},
        )
        self.assertEqual(oversized.status_code, 413)

        forbidden = self.client.post(
            "/challenges/two-sum/submit",
            json={"code": "import os\ndef two_sum(nums, target):\n    return []"},
        )
        self.assertEqual(forbidden.status_code, 400)
        self.assertIn("não permitido", forbidden.json()["detail"])

    def test_local_runner_is_rejected_in_production(self) -> None:
        settings.environment = "production"
        settings.code_runner = "local"

        response = self.client.post(
            "/challenges/two-sum/submit",
            json={"code": "def two_sum(nums, target):\n    return [0, 1]"},
        )

        self.assertEqual(response.status_code, 503)
        self.assertIn("não pode ser usado em produção", response.json()["detail"])

    def test_hint_uses_llm_service_without_running_tests(self) -> None:
        response = self.client.post(
            "/challenges/two-sum/hint",
            json={"code": "def two_sum(nums, target):\n    return []"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {"hint": "Voce esta no caminho certo, mas revise os casos de borda sem mudar a assinatura."},
        )
        self.assertEqual(self.fake_llm.calls, [("two-sum", "def two_sum(nums, target):\n    return []")])


if __name__ == "__main__":
    unittest.main()
