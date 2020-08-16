from datetime import datetime
from typing import Dict, List

import numpy as np
import pandas as pd
import pytest
from pandas._testing import assert_frame_equal, assert_series_equal

from lib.util.pandas_utils import pd_historic_prices_from_json, pd_offset_from_lookback, take_nan


@pytest.mark.parametrize("historic_prices,expected",
                         [
                             ([], pd.Series()),
                             ([
                                  {"date": "2019-01-01T00:00:00Z", "price": 100},
                                  {"date": "2019-01-02T00:00:00Z", "price": 200},
                                  {"date": "2019-01-03T00:00:00Z", "price": 300}
                              ], pd.Series([100, 200, 300],
                                           index=pd.date_range(start=datetime(2019, 1, 1),
                                                               end=datetime(2019, 1, 3),
                                                               name="date"),
                                           name="price")
                             )
                         ])
def test_pd_series_from_historic_prices(historic_prices: List[Dict], expected: pd.Series):
    actual = pd_historic_prices_from_json(historic_prices)
    assert_series_equal(actual, expected, check_freq=False)


@pytest.mark.parametrize("lookback,expected",
                         [
                             ("1Y", pd.DateOffset(years=1)),
                             ("6M", pd.DateOffset(months=6)),
                             ("2W", pd.DateOffset(weeks=2)),
                             ("3D", pd.DateOffset(days=3)),
                         ])
def test_pd_offset_from_lookback(lookback: str, expected: pd.DateOffset):
    actual = pd_offset_from_lookback(lookback)
    assert actual == expected


def test_take_nan():
    df = pd.DataFrame([
        [1, 2],
        [3, 4],
        [5, 6],
        [7, 8]
    ])
    idx = pd.DataFrame([
        [np.nan, 1],
        [0, np.nan],
        [2, 3],
        [np.nan]
    ])
    expected = pd.DataFrame([
        [np.nan, 4],
        [1, np.nan],
        [5, 8],
        [np.nan, np.nan]
    ])
    assert_frame_equal(take_nan(df, idx), expected)
