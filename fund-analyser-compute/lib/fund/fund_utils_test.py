from datetime import datetime, date

import numpy as np
import pandas as pd

from lib.fund.fund import Fund
from lib.fund.fund_utils import merge_funds_historic_prices, support_resistance, stability


def test_merge_funds_historic_prices():
    fund1 = Fund(
        isin="isin1",
        historicPrices=pd.Series([101, 103], index=[datetime(2001, 1, 1), datetime(2001, 1, 3)]),
        sedol=None, name=None, type=None, shareClass=None, frequency=None, ocf=None, amc=None, entryCharge=None,
        exitCharge=None, bidAskSpread=None, holdings=None, returns=None, asof=None, indicators=None,
        realTimeDetails=None
    )
    fund2 = Fund(
        isin="isin2",
        historicPrices=pd.Series([202, np.nan, 205],
                                 index=[datetime(2001, 1, 2), datetime(2001, 1, 3), datetime(2001, 1, 5)]),
        sedol=None, name=None, type=None, shareClass=None, frequency=None, ocf=None, amc=None, entryCharge=None,
        exitCharge=None, bidAskSpread=None, holdings=None, returns=None, asof=None, indicators=None,
        realTimeDetails=None
    )

    expected = pd.DataFrame([
        [101.0, np.nan],
        [101.0, 202.0],
        [103.0, 202.0],
        [103.0, 202.0],
        [103.0, 205.0]],
        index=pd.date_range(datetime(2001, 1, 1), datetime(2001, 1, 5)),
        columns=["isin1", "isin2"]
    )
    actual = merge_funds_historic_prices([fund1, fund2])
    assert actual.equals(expected)

    actual_with_start = merge_funds_historic_prices([fund1, fund2], start=datetime(2001, 1, 2))
    assert actual_with_start.equals(expected[1:])

    actual_with_end = merge_funds_historic_prices([fund1, fund2], end=datetime(2001, 1, 4))
    assert actual_with_end.equals(expected[:-1])


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
