from datetime import date

import pandas as pd

from lib.indicators.indicator_utils import support_resistance, stability


def test_support_resistance():
    prices_df = pd.DataFrame(
        [[101.0, 101.0],
         [101.0, 102.0],
         [103.0, 102.0],
         [103.0, 103.0],
         [102.0, 103.0],
         [102.0, 102.0],
         [101.0, 104.0],
         [102.0, 104.0]],
        index=pd.date_range(date(2001, 1, 1), date(2001, 1, 8)),
        columns=["isin1", "isin2"]
    )
    expected = pd.DataFrame(
        [[0, 0],
         [0, 0],
         [0, 0],
         [-1, 0],
         [0, -1],
         [0, 1],
         [1, 0],
         [0, 0]],
        index=pd.date_range(date(2001, 1, 1), date(2001, 1, 8)),
        columns=["isin1", "isin2"]
    ).astype("int")
    actual = support_resistance(prices_df)
    assert actual.equals(expected)


def test_stability():
    prices_df = pd.DataFrame(
        [[101.0, 101.0],
         [101.0, 102.0],
         [103.0, 102.0],
         [103.0, 103.0],
         [102.0, 103.0],
         [102.0, 102.0],
         [101.0, 104.0],
         [102.0, 104.0]],
        index=pd.date_range(date(2001, 1, 1), date(2001, 1, 8)),
        columns=["isin1", "isin2"]
    )
    expected = pd.Series([0.25, 0.25], index=["isin1", "isin2"])
    actual = stability(prices_df)
    assert actual.equals(expected)
