import re
from typing import Dict, List, Optional, Union

import numpy as np
import pandas as pd

from lib.fund.fund import FundHistoricPrices
from lib.stock.stock import StockHistoricPrices


def pd_historic_prices_from_json(historic_prices_json: List[Dict]) -> Union[FundHistoricPrices, StockHistoricPrices]:
    if not len(historic_prices_json):
        return pd.Series()
    historic_prices = pd.DataFrame.from_records(historic_prices_json, index="date").squeeze(axis=1)
    historic_prices.index = pd.to_datetime(historic_prices.index).tz_convert(None)
    return historic_prices


def pd_offset_from_lookback(lookback: str) -> Optional[pd.DateOffset]:
    match = re.search(r"^(\d+)([DWMY])", lookback)
    if not match:
        return None
    else:
        n = int(match.group(1))
        unit = match.group(2)
        if unit == "D":
            return pd.DateOffset(days=n)
        if unit == "W":
            return pd.DateOffset(weeks=n)
        if unit == "M":
            return pd.DateOffset(months=n)
        if unit == "Y":
            return pd.DateOffset(years=n)
    raise ValueError(f"Unrecognised lookback: {lookback}")


def drop_duplicate_index(df: pd.DataFrame) -> pd.DataFrame:
    return df[~df.index.duplicated()]


def take_nan(df: pd.DataFrame, idx: pd.DataFrame) -> pd.DataFrame:
    """
    Similar to pandas.DataFrame.take(), but gracefully handles nan idx values.
    """
    arr, idx_arr = df.to_numpy(), idx.to_numpy()
    idx_nan_locs = np.isnan(idx_arr)
    idx_zero_filled = np.where(idx_nan_locs, 0, idx_arr).astype(np.int64)
    res = np.empty_like(arr, dtype=np.float64)
    for col in range(res.shape[1]):
        res[:, col] = np.take(arr[:, col], idx_zero_filled[:, col])
    res = np.where(idx_nan_locs, np.nan, res)

    def fix_return_type():
        if np.any(np.isnan(res)) and arr.dtype == "int64":
            return "float64"  # need to support nans
        return arr.dtype

    return pd.DataFrame(
        res,
        index=df.index,
        columns=df.columns,
        dtype=fix_return_type())
