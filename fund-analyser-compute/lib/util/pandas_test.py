from datetime import datetime
from typing import List, Dict

import pandas as pd
import pytest

from lib.util.pandas import pd_historic_prices_from_json, pd_offset_from_lookback


@pytest.mark.parametrize("historic_prices,expected",
                         [
                             ([], pd.Series()),
                             ([
                                  {"date": "2019-01-01T00:00:00Z", "price": 100},
                                  {"date": "2019-01-02T00:00:00Z", "price": 200},
                                  {"date": "2019-01-03T00:00:00Z", "price": 300}
                              ], pd.Series([100, 200, 300],
                                           index=pd.date_range(start=datetime(2019, 1, 1),
                                                               end=datetime(2019, 1, 3)))
                             )
                         ])
def test_pd_series_from_historic_prices(historic_prices: List[Dict], expected: pd.Series):
    actual = pd_historic_prices_from_json(historic_prices)
    assert actual.equals(expected)


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
