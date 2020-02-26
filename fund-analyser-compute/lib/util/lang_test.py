from lib.util.lang import intersection, union


def test_intersection():
    assert intersection([1, 2, 2, 3], [2, 2, 2, 3, 3, 4, 4]) == [2, 3]


def test_union():
    assert union([1, 2, 2, 3], [2, 2, 2, 3, 3, 4, 4]) == [1, 2, 3, 4]
