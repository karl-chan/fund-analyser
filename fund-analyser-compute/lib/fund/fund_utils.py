from datetime import date
from typing import Callable, List, Optional

import pandas as pd
from ffn import calc_sharpe
from pandas.tseries.frequencies import to_offset

from lib.fund.fund import Fund
from lib.util import properties

DAILY_PLATFORM_FEES = (1 + properties.get("fund.fees.platform.charge")) ** (1 / 252) - 1


def calc_returns(prices_df: pd.DataFrame, dt: date, duration: pd.DateOffset, fees_df: pd.DataFrame) -> pd.Series:
    window = prices_df[dt - duration: dt]  # type: ignore
    returns_before_fees = (window.iloc[-1] - window.iloc[0]) / window.iloc[0] if len(window) else 0

    num_bdays = len(window.index) - 1
    prorated_annual_fees = (1 + fees_df["total_annual_fees"]) ** (num_bdays / 252) - 1
    prorated_total_fees = fees_df["total_one_off_fees"] + prorated_annual_fees

    returns_after_fees = returns_before_fees - prorated_total_fees
    return returns_after_fees


def calc_fees(funds: List[Fund]) -> pd.DataFrame:
    platform_charge = properties.get("fund.fees.platform.charge")
    fees = pd.DataFrame(
        [[fund.ocf, fund.amc, fund.entryCharge, fund.exitCharge, fund.bidAskSpread, platform_charge,
          sum(filter(None, [fund.entryCharge, fund.exitCharge, fund.bidAskSpread])),
          sum(filter(None, [fund.ocf, platform_charge]))] for fund in funds],
        index=[fund.isin for fund in funds],
        columns=["ocf", "amc", "entry_charge", "exit_charge", "bid_ask_spread", "platform_charge",
                 "total_one_off_fees",
                 "total_annual_fees"]
    )
    return fees


def calc_hold_interval(prices_df: pd.DataFrame, dt: date, isins: List[str],
                       default_hold_interval: pd.DateOffset) -> pd.DateOffset:
    funcs: List[Callable[[pd.DataFrame, date, List[str]], date]] = []  # min_recovery_date]

    next_dt = (dt + default_hold_interval).date()
    for f in funcs:
        candidate = f(prices_df, dt, isins)
        if candidate and candidate > next_dt:
            next_dt = candidate
    return to_offset(next_dt - dt)


def calc_sharpe_ratio(prices_series: pd.Series, risk_free_rate=0.0) -> float:
    avg_interval_days = prices_series.index.to_series().diff().mean().days
    return calc_sharpe(prices_series.pct_change(),
                       rf=risk_free_rate,
                       nperiods=252 / avg_interval_days)


def min_recovery_date(prices_df: pd.DataFrame, dt: date, isins: List[str]) -> Optional[date]:
    prices = prices_df.loc[dt:, isins]  # type: ignore
    series = prices.mean(axis=1)
    start_price = series.loc[dt]
    try:
        return series[(series.index > pd.to_datetime(dt)) & (series >= start_price)].index[0].date()
    except IndexError:
        return None
