from functools import reduce
from typing import Iterable, List, TypeVar

T = TypeVar('T')


def intersection(*args: Iterable[T]) -> List[T]:
    return list(reduce(lambda a1, a2: set(a1) & set(a2), args))


def union(*args: Iterable[T]) -> List[T]:
    return list(reduce(lambda a1, a2: set(a1) | set(a2), args))
