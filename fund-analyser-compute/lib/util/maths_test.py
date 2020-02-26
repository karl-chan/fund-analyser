import numpy as np

from lib.util.maths import format_float, replace_nan


def test_replace_nan():
    assert replace_nan(np.nan) is None
    assert replace_nan(np.nan, -1) == -1
    assert replace_nan(0, 100) == 0
    assert replace_nan(np.inf, 100) == np.inf


def test_format_float():
    assert format_float(np.nan) == "nan"
    assert format_float(np.inf) == "inf"
    assert format_float(1) == "1.00"
    assert format_float(0.03) == "0.03"
    assert format_float(-0.03) == "-0.03"
    assert format_float(0.033333) == "0.03"
    assert format_float(-0.033333) == "-0.03"
