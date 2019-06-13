import logging
from datetime import date
from typing import Callable, Tuple

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.preprocessing import normalize

from lib.fund import fund_cache
from lib.fund.fund_utils import merge_funds_historic_prices, calc_fees

logging.basicConfig(level=logging.DEBUG)
pd.set_option('display.max_colwidth', 10000)

BDAY = pd.tseries.offsets.BusinessDay(n=1)
peek_interval_days = 125
hold_interval = 20 * BDAY

start_date = (date.today() - pd.DateOffset(years=5)).date()
end_date = (date.today() - hold_interval).date()

funds = fund_cache.get()
funds_lookup = {fund.isin: fund for fund in funds}

merged_historic_prices = merge_funds_historic_prices(funds)
daily_returns = merged_historic_prices.pct_change()
fees_df = calc_fees(funds)


def calc_returns(prices_df: pd.DataFrame, dt: date, duration: pd.DateOffset, fees_df: pd.DataFrame) -> pd.DataFrame:
    window = prices_df[dt - duration: dt]
    returns_before_fees = (window.iloc[-1] - window.iloc[0]) / window.iloc[0]
    returns_after_fees = returns_before_fees * (1 - fees_df["total"])
    return returns_after_fees


def filter_by_returns(prices_df: pd.DataFrame,
                      dt: date,
                      returns_cond: Callable[[float], bool]) -> Tuple[np.array, np.array]:
    next_dt = (dt + hold_interval).date()
    next_returns = calc_returns(prices_df, next_dt, hold_interval, fees_df)
    isins = next_returns.index[next_returns.apply(returns_cond)]
    prices = prices_df.loc[:dt, isins].tail(peek_interval_days).dropna(axis=1)
    non_na_isins = prices.columns
    return prices.values.transpose(), \
           next_returns[non_na_isins].values


if __name__ == "__main__":
    _xs, _ys = [], []
    more_than_5_pct = lambda r: r > 0.2  # 5%
    for dt in pd.date_range(start_date, end_date, freq='B'):
        _x, _y = filter_by_returns(merged_historic_prices, dt, more_than_5_pct)
        _xs.append(_x)
        _ys.append(_y)
        print(f'Date: {dt}')
    x, y = np.concatenate(_xs), np.concatenate(_ys)
    print(f'Total matching rows: {x.shape[0]}')
    x_norm = normalize(x)
    sample_rows = 10
    sample_x = x_norm[np.random.choice(x_norm.shape[0], sample_rows, replace=False)]
    fig = plt.figure()
    for row in sample_x:
        fig.add_subplot()
        plt.plot(row)
    plt.show()
