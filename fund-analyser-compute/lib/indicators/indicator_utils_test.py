from datetime import date

import numpy as np
import pandas as pd
from pandas._testing import assert_frame_equal, assert_series_equal

from lib.indicators.indicator_utils import stability, support_resistance


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
    expected_sr = pd.DataFrame(
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
    )
    expected_prev_support_dates = pd.DataFrame(
        [[pd.NaT, pd.NaT],
         [pd.NaT, pd.NaT],
         [pd.NaT, pd.NaT],
         [pd.NaT, pd.NaT],
         [pd.NaT, pd.NaT],
         [pd.NaT, date(2001, 1, 6)],
         [date(2001, 1, 7), date(2001, 1, 6)],
         [date(2001, 1, 7), date(2001, 1, 6)]],
        index=pd.date_range(date(2001, 1, 1), date(2001, 1, 8)),
        columns=["isin1", "isin2"]
    ).astype("datetime64[ns]")
    expected_prev_support_prices = pd.DataFrame(
        [[np.nan, np.nan],
         [np.nan, np.nan],
         [np.nan, np.nan],
         [np.nan, np.nan],
         [np.nan, np.nan],
         [np.nan, 102.0],
         [101.0, 102.0],
         [101.0, 102.0]],
        index=pd.date_range(date(2001, 1, 1), date(2001, 1, 8)),
        columns=["isin1", "isin2"]
    )
    expected_prev_resistance_dates = pd.DataFrame(
        [[pd.NaT, pd.NaT],
         [pd.NaT, pd.NaT],
         [pd.NaT, pd.NaT],
         [date(2001, 1, 4), pd.NaT],
         [date(2001, 1, 4), date(2001, 1, 5)],
         [date(2001, 1, 4), date(2001, 1, 5)],
         [date(2001, 1, 4), date(2001, 1, 5)],
         [date(2001, 1, 4), date(2001, 1, 5)]],
        index=pd.date_range(date(2001, 1, 1), date(2001, 1, 8)),
        columns=["isin1", "isin2"]
    ).astype("datetime64[ns]")
    expected_prev_resistance_prices = pd.DataFrame(
        [[np.nan, np.nan],
         [np.nan, np.nan],
         [np.nan, np.nan],
         [103.0, np.nan],
         [103.0, 103.0],
         [103.0, 103.0],
         [103.0, 103.0],
         [103.0, 103.0]],
        index=pd.date_range(date(2001, 1, 1), date(2001, 1, 8)),
        columns=["isin1", "isin2"]
    )
    sr, prev_support_dates, prev_support_prices, prev_resistance_dates, prev_resistance_prices \
        = support_resistance(prices_df)
    assert_frame_equal(sr, expected_sr)
    assert_frame_equal(prev_support_dates, expected_prev_support_dates)
    assert_frame_equal(prev_support_prices, expected_prev_support_prices)
    assert_frame_equal(prev_resistance_dates, expected_prev_resistance_dates)
    assert_frame_equal(prev_resistance_prices, expected_prev_resistance_prices)


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
    assert_series_equal(actual, expected)
