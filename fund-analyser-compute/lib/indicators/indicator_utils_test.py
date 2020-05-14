from datetime import date

import numpy as np
import pandas as pd
from pandas._testing import assert_frame_equal, assert_series_equal

from lib.indicators.indicator_utils import stability, support_resistance


def test_support_resistance():
    index = pd.date_range(date(2001, 1, 1), date(2001, 1, 13))
    columns = ["isin1", "isin2"]
    prices = [
        [100.0, 100.0],
        [100.0, 100.0],
        [104.0, 96.0],
        [104.0, 96.0],
        [99.0, 101.0],
        [99.0, 101.0],
        [102.0, 98.0],
        [102.0, 98.0],
        [101.0, 99.0],
        [101.0, 99.0],
        [103.0, 97.0],
        [103.0, 97.0],
        [100.0, 100.0]
    ]
    # isin1: support at (6th: 99, 10th: 101), resistance at (4th: 104, 8th: 102, 12th: 103)
    # isin2: support at (4th: 96, 8th: 98, 12th: 97), resistance at (6th: 101, 10th: 99)
    supports = [
        [(pd.NaT, np.nan), (pd.NaT, np.nan)],
        [(pd.NaT, np.nan), (pd.NaT, np.nan)],
        [(pd.NaT, np.nan), (pd.NaT, np.nan)],
        [(pd.NaT, np.nan), (pd.NaT, np.nan)],
        [(pd.NaT, np.nan), (date(2001, 1, 4), 96.0)],
        [(pd.NaT, np.nan), (date(2001, 1, 4), 96.0)],
        [(date(2001, 1, 6), 99.0), (date(2001, 1, 4), 96.0)],
        [(date(2001, 1, 6), 99.0), (date(2001, 1, 4), 96.0)],
        [(date(2001, 1, 6), 99.0), (date(2001, 1, 8), 98.0)],
        [(date(2001, 1, 6), 99.0), (date(2001, 1, 8), 98.0)],
        [(date(2001, 1, 10), 101.0), (date(2001, 1, 4), 96.0)],
        [(date(2001, 1, 10), 101.0), (date(2001, 1, 4), 96.0)],
        [(date(2001, 1, 6), 99.0), (date(2001, 1, 12), 97.0)]
    ]
    resistances = [
        [(pd.NaT, np.nan), (pd.NaT, np.nan)],
        [(pd.NaT, np.nan), (pd.NaT, np.nan)],
        [(pd.NaT, np.nan), (pd.NaT, np.nan)],
        [(pd.NaT, np.nan), (pd.NaT, np.nan)],
        [(date(2001, 1, 4), 104.0), (pd.NaT, np.nan)],
        [(date(2001, 1, 4), 104.0), (pd.NaT, np.nan)],
        [(date(2001, 1, 4), 104.0), (date(2001, 1, 6), 101.0)],
        [(date(2001, 1, 4), 104.0), (date(2001, 1, 6), 101.0)],
        [(date(2001, 1, 8), 102.0), (date(2001, 1, 6), 101.0)],
        [(date(2001, 1, 8), 102.0), (date(2001, 1, 6), 101.0)],
        [(date(2001, 1, 4), 104.0), (date(2001, 1, 10), 99.0)],
        [(date(2001, 1, 4), 104.0), (date(2001, 1, 10), 99.0)],
        [(date(2001, 1, 12), 103.0), (date(2001, 1, 6), 101.0)]
    ]
    prices_df = pd.DataFrame(prices, index=index, columns=columns)
    expected_prev_support_dates = pd.DataFrame(
        [[row[0][0], row[1][0]] for row in supports],
        index=index,
        columns=columns
    ).astype("datetime64[ns]")
    expected_prev_support_prices = pd.DataFrame(
        [[row[0][1], row[1][1]] for row in supports],
        index=index,
        columns=columns
    )
    expected_prev_resistance_dates = pd.DataFrame(
        [[row[0][0], row[1][0]] for row in resistances],
        index=index,
        columns=columns
    ).astype("datetime64[ns]")
    expected_prev_resistance_prices = pd.DataFrame(
        [[row[0][1], row[1][1]] for row in resistances],
        index=index,
        columns=columns
    )
    prev_support_dates, prev_support_prices, prev_resistance_dates, prev_resistance_prices \
        = support_resistance(prices_df)
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
