from lib.types.enum import StrEnum


class TestEnum(StrEnum):
    __test__ = False
    A = "a"
    B = "b"


def test_from_empty():
    assert TestEnum.from_str("") is None


def test_from_str():
    assert TestEnum.from_str("a") == TestEnum.A
    assert TestEnum.from_str("b") == TestEnum.B
