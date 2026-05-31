"""Seed data do catálogo LeetCode.

Slugs e URLs reais, verificados à mão. Cobre os tópicos centrais de entrevista:
arrays, strings, hashing, two pointers, sliding window, stack, binary search,
linked list, trees, graphs e DP.
"""

from sqlmodel import Session, select

from models.db_models import LeetcodeProblem


def _url(slug: str) -> str:
    return f"https://leetcode.com/problems/{slug}/"


SEED_PROBLEMS: list[dict] = [
    {
        "slug": "two-sum",
        "title": "Two Sum",
        "description": "Encontre os índices de dois números que somam um alvo.",
        "difficulty": "Easy",
        "category": "Arrays",
    },
    {
        "slug": "contains-duplicate",
        "title": "Contains Duplicate",
        "description": "Verifique se algum valor aparece mais de uma vez no array.",
        "difficulty": "Easy",
        "category": "Hashing",
    },
    {
        "slug": "valid-anagram",
        "title": "Valid Anagram",
        "description": "Determine se duas strings são anagramas uma da outra.",
        "difficulty": "Easy",
        "category": "Strings",
    },
    {
        "slug": "valid-palindrome",
        "title": "Valid Palindrome",
        "description": "Verifique se uma string é palíndromo considerando só alfanuméricos.",
        "difficulty": "Easy",
        "category": "Two Pointers",
    },
    {
        "slug": "two-sum-ii-input-array-is-sorted",
        "title": "Two Sum II - Input Array Is Sorted",
        "description": "Two Sum em array ordenado usando dois ponteiros.",
        "difficulty": "Medium",
        "category": "Two Pointers",
    },
    {
        "slug": "best-time-to-buy-and-sell-stock",
        "title": "Best Time to Buy and Sell Stock",
        "description": "Maximize o lucro de uma única compra e venda de ação.",
        "difficulty": "Easy",
        "category": "Sliding Window",
    },
    {
        "slug": "longest-substring-without-repeating-characters",
        "title": "Longest Substring Without Repeating Characters",
        "description": "Encontre o tamanho da maior substring sem caracteres repetidos.",
        "difficulty": "Medium",
        "category": "Sliding Window",
    },
    {
        "slug": "valid-parentheses",
        "title": "Valid Parentheses",
        "description": "Verifique se os parênteses/colchetes estão balanceados.",
        "difficulty": "Easy",
        "category": "Stack",
    },
    {
        "slug": "binary-search",
        "title": "Binary Search",
        "description": "Busque um alvo em um array ordenado em O(log n).",
        "difficulty": "Easy",
        "category": "Binary Search",
    },
    {
        "slug": "reverse-linked-list",
        "title": "Reverse Linked List",
        "description": "Inverta uma lista ligada simples.",
        "difficulty": "Easy",
        "category": "Linked List",
    },
    {
        "slug": "merge-two-sorted-lists",
        "title": "Merge Two Sorted Lists",
        "description": "Combine duas listas ligadas ordenadas em uma só.",
        "difficulty": "Easy",
        "category": "Linked List",
    },
    {
        "slug": "invert-binary-tree",
        "title": "Invert Binary Tree",
        "description": "Inverta (espelhe) uma árvore binária.",
        "difficulty": "Easy",
        "category": "Trees",
    },
    {
        "slug": "maximum-depth-of-binary-tree",
        "title": "Maximum Depth of Binary Tree",
        "description": "Calcule a profundidade máxima de uma árvore binária.",
        "difficulty": "Easy",
        "category": "Trees",
    },
    {
        "slug": "number-of-islands",
        "title": "Number of Islands",
        "description": "Conte ilhas em uma grade usando busca em grafo (DFS/BFS).",
        "difficulty": "Medium",
        "category": "Graphs",
    },
    {
        "slug": "climbing-stairs",
        "title": "Climbing Stairs",
        "description": "Conte de quantas formas é possível subir n degraus (DP clássico).",
        "difficulty": "Easy",
        "category": "DP",
    },
    {
        "slug": "coin-change",
        "title": "Coin Change",
        "description": "Menor número de moedas para formar um valor (DP).",
        "difficulty": "Medium",
        "category": "DP",
    },
]


def seed_leetcode(session: Session) -> None:
    """Insere os problemas do catálogo que ainda não existem. Idempotente."""
    for item in SEED_PROBLEMS:
        exists = session.exec(
            select(LeetcodeProblem).where(LeetcodeProblem.slug == item["slug"])
        ).first()
        if exists is None:
            session.add(LeetcodeProblem(url=_url(item["slug"]), **item))
    session.commit()
