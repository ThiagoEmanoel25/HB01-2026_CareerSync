# Code Challenge Backend Design

Date: 2026-05-30

## Goal

Add a fixed Python code challenge practice flow to `/code-challenge` while preserving the current analysis-based challenge flow. The new flow must provide deterministic test-based correction and a separate AI hint button that gives coaching without revealing code.

## Decisions

- Keep the existing analysis-driven endpoints and LLM evaluation behavior intact.
- Add a new fixed catalog of 8 Python challenges.
- Require users to implement a named Python function for each challenge.
- Grade submissions with backend tests, not with an LLM.
- Run submitted code in a local subprocess only for development and MVP demos.
- Treat AST validation as a preflight guard only, not as a sandbox.
- Forbid the local subprocess runner in production.
- Use the LLM only for hints based on the problem and the user's current code.
- Do not persist submissions in the MVP.

## Challenge Catalog

The backend will expose a static catalog in code, not in the database. Each challenge contains:

- `slug`
- `title`
- `difficulty`
- `category`
- `reason`
- `description`
- `function_name`
- `signature`
- `examples`
- `constraints`
- hidden `test_cases`

The 8 MVP challenges are:

| Category | Challenges |
| --- | --- |
| Array | Best Time to Buy/Sell Stock; Maximum Subarray |
| Two Pointer | Valid Palindrome; Two Sum II |
| Hashmap | Two Sum |
| Sliding Window | Longest Substring Without Repeating Characters |
| Linked List | Reverse Linked List; Merge Two Sorted Lists |

Linked list challenges will use a backend-provided `ListNode` helper. Test inputs use arrays, the harness converts arrays into linked lists before calling the user's function, and return values are serialized back to arrays for comparison.

Each challenge must also define comparison semantics explicitly. Most challenges use exact equality, but challenges that can return multiple valid answers must normalize or validate the result by challenge-specific logic. For example, `Two Sum` may accept either index order if the returned indexes are valid and point to values that sum to the target; `Two Sum II` must return 1-indexed positions.

## API

Add new routes independent of `analysisId`:

- `GET /challenges`
- `GET /challenges/{slug}`
- `POST /challenges/{slug}/submit`
- `POST /challenges/{slug}/hint`

`GET` routes never expose hidden test cases.

`POST /challenges/{slug}/submit` accepts:

```json
{
  "code": "def two_sum(nums, target):\n    ..."
}
```

It returns whether the solution passed, how many tests passed, the total number of tests, and details for only the first failed case.

`POST /challenges/{slug}/hint` accepts the same code payload and returns prose feedback. It must not include a complete solution or code snippets.

Request limits:

- Reject `code` larger than 10 KB.
- Add rate limiting by IP before public exposure.
- Add a maximum concurrent execution limit for the submit endpoint.
- Add a maximum concurrent hint limit or shared rate limit to control LLM cost.

## Runner

Define a runner interface so the execution backend can be replaced later:

```python
class CodeRunner(Protocol):
    def run(self, code, challenge) -> RunResult:
        ...
```

The MVP implementation is `LocalPythonSubprocessRunner`.

Runner selection must be controlled by configuration, for example `CODE_RUNNER=local|external`. The application must refuse to start, or the submit endpoint must return a configuration error, when `environment=production` and `CODE_RUNNER=local`. Public production deployments must use an isolated execution backend such as Judge0, Docker-based isolation with strict resource controls, or a dedicated execution service.

Execution flow:

1. Parse the submitted code with `ast.parse`.
2. Reject obvious unsafe operations and imports before execution as defense-in-depth only.
3. Write a temporary Python file containing helpers, user code, and the test harness.
4. Run the file in a Python subprocess with a short timeout from outside the FastAPI event loop.
5. Capture the harness result from a dedicated result file or file descriptor, not from stdout.
6. Return a normalized result to the API.

FastAPI integration:

- Do not call `subprocess.run` directly inside an `async def` route.
- Either make the submit route synchronous (`def`) so FastAPI runs it in the threadpool, or call the runner through `anyio.to_thread.run_sync` / `run_in_executor`.
- The hint route can remain async because it calls the existing async LLM service.

The AST validation should reject at least:

- imports of `os`, `sys`, `subprocess`, `socket`, and similar system modules
- calls to `open`, `eval`, `exec`, `__import__`, `compile`, `input`, `globals`, `locals`, and `vars`

The AST validation is not a security boundary. Python object introspection and builtins can bypass name-based deny lists. The local runner must never be considered safe for untrusted public traffic.

Output and result-channel handling:

- Redirect or capture user stdout and stderr separately so `print(...)` does not corrupt the harness result.
- Cap captured stdout/stderr size and truncate it in responses.
- Prefer writing the harness JSON result to a temp file created by the parent process and passed to the child as an argument or environment value.
- If the result file is missing or invalid, return a controlled runner error instead of treating stdout parse failure as a user-code failure.

Resource limits:

- Always enforce a short wall-clock timeout.
- On Windows, do not claim memory isolation because POSIX `resource` limits are unavailable.
- Document local memory exhaustion as an accepted MVP risk.
- For public deployment, require an isolated runner that can enforce memory, CPU, process, filesystem, and network limits.

## Result Policy

Submission feedback should reveal enough for learning without dumping the full hidden test suite.

When tests fail:

- Show `input`, `expected`, and `actual` only for the first failing case.
- Show the total number of tests and passed count.
- Do not reveal the remaining hidden cases.

When execution fails:

- Show a concise error type and message.
- Avoid exposing noisy internal harness details.

When execution times out:

- Return a timeout status and indicate that the solution may contain an infinite loop or inefficient logic.

When user output is too large:

- Stop the execution or truncate captured output.
- Return a controlled output-limit error if the runner cannot safely continue.

## AI Hints

Hints are separate from grading. The hint endpoint receives:

- challenge title
- description
- category
- signature
- current user code

The hint prompt must ask for coaching only:

- explain how the user seems to be approaching the problem
- point out missing edge cases or conceptual gaps
- suggest the next idea to investigate
- avoid code, pseudocode that is too close to code, and full solutions

The hint endpoint does not run tests and does not determine correctness.

## Frontend

Update `/code-challenge` to add a fixed practice catalog section using the new `/challenges` endpoints.

The practice experience should include:

- challenge list
- description, examples, constraints, and required signature
- Python editor initialized from `signature`
- submit button for deterministic tests
- hint button for AI coaching
- result panel showing pass/fail, counts, and first failing case details

The existing analysis-based recommendations can remain as a separate section or continue unchanged. They should not block the fixed challenge catalog from working when no analysis is selected.

## Testing

Backend tests should cover:

- catalog returns exactly 8 challenges
- catalog category distribution matches the requirement
- challenge detail does not expose hidden tests
- challenge-specific comparison semantics, including unordered `Two Sum` indexes and 1-indexed `Two Sum II` indexes
- a correct solution passes
- an incorrect solution fails with first failed case details only
- timeout is handled
- user `print(...)` does not corrupt the harness result
- oversized code is rejected
- oversized output is controlled or truncated
- the local runner is rejected when production environment is configured
- forbidden import or call is rejected
- hint endpoint calls the LLM service with problem and code context

Frontend verification should cover:

- page loads without requiring `analysisId` for the fixed catalog
- selecting a challenge loads the Python stub
- submit displays pass/fail results
- hint displays coaching text

## Non-Goals

- No multi-language support in the MVP.
- No submission history.
- No rankings or scoring system.
- No public-grade sandbox in this implementation.
- No removal of existing analysis-based code challenge behavior.

## Deployment Notes

Vercel is a poor fit for the local subprocess runner because serverless functions have short execution windows, constrained subprocess behavior, cold starts, and limited writable filesystem access outside `/tmp`. Render, Railway, Fly, or another container-oriented host is a better fit for the backend, especially once a dedicated isolated runner is introduced.

Production exposure of code execution requires the local runner to be replaced before launch. This is a release gate, not a later hardening task.
