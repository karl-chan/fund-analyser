import numpy as np

from lib.util.math import replace_nan


def test_replace_nan():
    assert replace_nan(np.nan) is None
    assert replace_nan(np.nan, -1) == -1
    assert replace_nan(0, 100) == 0
    assert replace_nan(np.inf, 100) == np.inf
