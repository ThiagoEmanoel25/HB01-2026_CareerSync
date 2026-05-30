from dataclasses import dataclass
from typing import Literal

from fastapi import HTTPException


Comparator = Literal["exact", "two_sum", "two_sum_sorted"]
Transform = Literal["identity", "list_node"]


@dataclass(frozen=True)
class Example:
    input: dict
    expected: object
    explanation: str | None = None


@dataclass(frozen=True)
class TestCase:
    input: dict
    expected: object


@dataclass(frozen=True)
class Challenge:
    slug: str
    title: str
    difficulty: Literal["Easy", "Medium", "Hard"]
    category: str
    reason: str
    description: str
    function_name: str
    signature: str
    examples: list[Example]
    constraints: list[str]
    test_cases: list[TestCase]
    parameter_order: list[str]
    comparator: Comparator = "exact"
    input_transforms: dict[str, Transform] | None = None
    output_transform: Transform = "identity"


CHALLENGES: list[Challenge] = [
    Challenge(
        slug="best-time-to-buy-and-sell-stock",
        title="Best Time to Buy/Sell Stock",
        difficulty="Easy",
        category="Array",
        reason="Treina varredura linear e manutencao de melhor estado em arrays.",
        description=(
            "Dado um array prices onde prices[i] representa o preco de uma acao no dia i, "
            "retorne o maior lucro possivel comprando antes de vender. Se nao houver lucro, retorne 0."
        ),
        function_name="max_profit",
        signature="def max_profit(prices):\n    pass",
        examples=[
            Example(input={"prices": [7, 1, 5, 3, 6, 4]}, expected=5),
            Example(input={"prices": [7, 6, 4, 3, 1]}, expected=0),
        ],
        constraints=["1 <= len(prices) <= 100000", "0 <= prices[i] <= 10000"],
        test_cases=[
            TestCase(input={"prices": [7, 1, 5, 3, 6, 4]}, expected=5),
            TestCase(input={"prices": [7, 6, 4, 3, 1]}, expected=0),
            TestCase(input={"prices": [1, 2]}, expected=1),
            TestCase(input={"prices": [2, 4, 1]}, expected=2),
        ],
        parameter_order=["prices"],
    ),
    Challenge(
        slug="maximum-subarray",
        title="Maximum Subarray",
        difficulty="Medium",
        category="Array",
        reason="Cobre Kadane e raciocinio de acumulacao em arrays.",
        description="Dado um array de inteiros, retorne a maior soma de um subarray contiguo nao vazio.",
        function_name="max_sub_array",
        signature="def max_sub_array(nums):\n    pass",
        examples=[
            Example(input={"nums": [-2, 1, -3, 4, -1, 2, 1, -5, 4]}, expected=6),
            Example(input={"nums": [1]}, expected=1),
        ],
        constraints=["1 <= len(nums) <= 100000", "-10000 <= nums[i] <= 10000"],
        test_cases=[
            TestCase(input={"nums": [-2, 1, -3, 4, -1, 2, 1, -5, 4]}, expected=6),
            TestCase(input={"nums": [1]}, expected=1),
            TestCase(input={"nums": [5, 4, -1, 7, 8]}, expected=23),
            TestCase(input={"nums": [-3, -2, -5]}, expected=-2),
        ],
        parameter_order=["nums"],
    ),
    Challenge(
        slug="valid-palindrome",
        title="Valid Palindrome",
        difficulty="Easy",
        category="Two Pointer",
        reason="Exercita dois ponteiros e normalizacao de caracteres.",
        description=(
            "Retorne True se a string for palindromo considerando apenas caracteres alfanumericos "
            "e ignorando maiusculas/minusculas."
        ),
        function_name="is_palindrome",
        signature="def is_palindrome(s):\n    pass",
        examples=[
            Example(input={"s": "A man, a plan, a canal: Panama"}, expected=True),
            Example(input={"s": "race a car"}, expected=False),
        ],
        constraints=["1 <= len(s) <= 200000"],
        test_cases=[
            TestCase(input={"s": "A man, a plan, a canal: Panama"}, expected=True),
            TestCase(input={"s": "race a car"}, expected=False),
            TestCase(input={"s": " "}, expected=True),
            TestCase(input={"s": "0P"}, expected=False),
        ],
        parameter_order=["s"],
    ),
    Challenge(
        slug="two-sum-ii-input-array-is-sorted",
        title="Two Sum II",
        difficulty="Medium",
        category="Two Pointer",
        reason="Treina dois ponteiros em array ordenado e cuidado com indice 1-based.",
        description=(
            "Dado um array ordenado em ordem crescente e um target, retorne duas posicoes 1-indexed "
            "cujos valores somam target."
        ),
        function_name="two_sum_sorted",
        signature="def two_sum_sorted(numbers, target):\n    pass",
        examples=[Example(input={"numbers": [2, 7, 11, 15], "target": 9}, expected=[1, 2])],
        constraints=["2 <= len(numbers) <= 30000", "Retorne posicoes 1-indexed."],
        test_cases=[
            TestCase(input={"numbers": [2, 7, 11, 15], "target": 9}, expected=[1, 2]),
            TestCase(input={"numbers": [2, 3, 4], "target": 6}, expected=[1, 3]),
            TestCase(input={"numbers": [-1, 0], "target": -1}, expected=[1, 2]),
        ],
        parameter_order=["numbers", "target"],
        comparator="two_sum_sorted",
    ),
    Challenge(
        slug="two-sum",
        title="Two Sum",
        difficulty="Easy",
        category="Hashmap",
        reason="Cobre lookup por hashmap e retorno de indices.",
        description="Dado nums e target, retorne os indices de dois numeros que somam target.",
        function_name="two_sum",
        signature="def two_sum(nums, target):\n    pass",
        examples=[Example(input={"nums": [2, 7, 11, 15], "target": 9}, expected=[0, 1])],
        constraints=["2 <= len(nums) <= 10000", "Existe exatamente uma resposta valida."],
        test_cases=[
            TestCase(input={"nums": [2, 7, 11, 15], "target": 9}, expected=[0, 1]),
            TestCase(input={"nums": [3, 2, 4], "target": 6}, expected=[1, 2]),
            TestCase(input={"nums": [3, 3], "target": 6}, expected=[0, 1]),
        ],
        parameter_order=["nums", "target"],
        comparator="two_sum",
    ),
    Challenge(
        slug="longest-substring-without-repeating-characters",
        title="Longest Substring Without Repeating Characters",
        difficulty="Medium",
        category="Sliding Window",
        reason="Treina janela deslizante com controle de caracteres vistos.",
        description="Dada uma string, retorne o tamanho da maior substring sem caracteres repetidos.",
        function_name="length_of_longest_substring",
        signature="def length_of_longest_substring(s):\n    pass",
        examples=[
            Example(input={"s": "abcabcbb"}, expected=3),
            Example(input={"s": "bbbbb"}, expected=1),
        ],
        constraints=["0 <= len(s) <= 50000"],
        test_cases=[
            TestCase(input={"s": "abcabcbb"}, expected=3),
            TestCase(input={"s": "bbbbb"}, expected=1),
            TestCase(input={"s": "pwwkew"}, expected=3),
            TestCase(input={"s": ""}, expected=0),
        ],
        parameter_order=["s"],
    ),
    Challenge(
        slug="reverse-linked-list",
        title="Reverse Linked List",
        difficulty="Easy",
        category="Linked List",
        reason="Exercita manipulacao de ponteiros em lista encadeada.",
        description="Dada a cabeca de uma lista encadeada, retorne a cabeca da lista invertida.",
        function_name="reverse_list",
        signature="def reverse_list(head):\n    pass",
        examples=[Example(input={"head": [1, 2, 3, 4, 5]}, expected=[5, 4, 3, 2, 1])],
        constraints=["0 <= tamanho da lista <= 5000"],
        test_cases=[
            TestCase(input={"head": [1, 2, 3, 4, 5]}, expected=[5, 4, 3, 2, 1]),
            TestCase(input={"head": [1, 2]}, expected=[2, 1]),
            TestCase(input={"head": []}, expected=[]),
        ],
        parameter_order=["head"],
        input_transforms={"head": "list_node"},
        output_transform="list_node",
    ),
    Challenge(
        slug="merge-two-sorted-lists",
        title="Merge Two Sorted Lists",
        difficulty="Easy",
        category="Linked List",
        reason="Cobre merge ordenado e manipulacao basica de lista encadeada.",
        description="Una duas listas encadeadas ordenadas e retorne a cabeca da lista ordenada resultante.",
        function_name="merge_two_lists",
        signature="def merge_two_lists(list1, list2):\n    pass",
        examples=[Example(input={"list1": [1, 2, 4], "list2": [1, 3, 4]}, expected=[1, 1, 2, 3, 4, 4])],
        constraints=["0 <= tamanho de cada lista <= 5000"],
        test_cases=[
            TestCase(input={"list1": [1, 2, 4], "list2": [1, 3, 4]}, expected=[1, 1, 2, 3, 4, 4]),
            TestCase(input={"list1": [], "list2": []}, expected=[]),
            TestCase(input={"list1": [], "list2": [0]}, expected=[0]),
        ],
        parameter_order=["list1", "list2"],
        input_transforms={"list1": "list_node", "list2": "list_node"},
        output_transform="list_node",
    ),
]


_CHALLENGES_BY_SLUG = {challenge.slug: challenge for challenge in CHALLENGES}


def get_challenge(slug: str) -> Challenge:
    challenge = _CHALLENGES_BY_SLUG.get(slug)
    if challenge is None:
        raise HTTPException(status_code=404, detail="Desafio não encontrado.")
    return challenge
