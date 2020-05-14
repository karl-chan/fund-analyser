from datetime import date
from typing import List, Tuple

import numpy as np
import pandas as pd
import talib
from talib._ta_lib import MA_Type


def upper_bollinger_bands(prices_df: pd.DataFrame, timeperiod=5, stdev=1) -> pd.DataFrame:
    return prices_df.apply(lambda p: talib.BBANDS(p, timeperiod=timeperiod, nbdevup=stdev, nbdevdn=stdev,
                                                  matype=MA_Type.SMA)[0])


def middle_bollinger_bands(prices_df: pd.DataFrame, timeperiod=5, stdev=1) -> pd.DataFrame:
    return prices_df.apply(lambda p: talib.BBANDS(p, timeperiod=timeperiod, nbdevup=stdev, nbdevdn=stdev,
                                                  matype=MA_Type.SMA)[1])


def lower_bollinger_bands(prices_df: pd.DataFrame, timeperiod=5, stdev=1) -> pd.DataFrame:
    return prices_df.apply(lambda p: talib.BBANDS(p, timeperiod=timeperiod, nbdevup=stdev, nbdevdn=stdev,
                                                  matype=MA_Type.SMA)[2])


def adx(prices_df: pd.DataFrame, timeperiod=14) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    adxs, plus_dis, minus_dis = [], [], []
    for (isin, series) in prices_df.items():
        adx_series = talib.ADX(high=series, low=series, close=series, timeperiod=timeperiod)
        plus_di_series = talib.PLUS_DI(high=series, low=series, close=series, timeperiod=timeperiod)
        minus_di_series = talib.MINUS_DI(high=series, low=series, close=series, timeperiod=timeperiod)
        adx_series.name, plus_di_series.name, minus_di_series.name = (isin,) * 3
        adxs.append(adx_series)
        plus_dis.append(plus_di_series)
        minus_dis.append(minus_di_series)
    return pd.concat(adxs, axis=1), pd.concat(plus_dis, axis=1), pd.concat(minus_dis, axis=1)


def ppo(prices_df: pd.DataFrame, fast=12, slow=26, signal=9) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    ppos, pposignals, ppohists = [], [], []
    for (isin, series) in prices_df.items():
        ppo = talib.PPO(series, fastperiod=fast, slowperiod=slow, matype=MA_Type.EMA)
        try:
            pposignal = talib.EMA(ppo, timeperiod=signal)
        except:
            pposignal = pd.Series(np.nan, index=ppo.index)
        ppohist = ppo - pposignal
        ppo.name, pposignal.name, ppohist.name = (isin,) * 3
        ppos.append(ppo)
        pposignals.append(pposignal)
        ppohists.append(ppohist)
    return pd.concat(ppos, axis=1), pd.concat(pposignals, axis=1), pd.concat(ppohists, axis=1)


def support_resistance(prices_df: pd.DataFrame) -> \
        Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    prev_support_dates, prev_support_prices, prev_resistance_dates, prev_resistance_prices = [], [], [], []
    for isin, series in prices_df.items():
        prev_support_dates_series, prev_support_prices_series, prev_resistance_dates_series, prev_resistance_prices_series = support_resistance_series(
            series)
        prev_support_dates.append(prev_support_dates_series)
        prev_support_prices.append(prev_support_prices_series)
        prev_resistance_dates.append(prev_resistance_dates_series)
        prev_resistance_prices.append(prev_resistance_prices_series)
    return pd.concat(prev_support_dates, axis=1), \
           pd.concat(prev_support_prices, axis=1), \
           pd.concat(prev_resistance_dates, axis=1), \
           pd.concat(prev_resistance_prices, axis=1)


def support_resistance_series(prices_series: pd.Series) -> \
        Tuple[pd.Series, pd.Series, pd.Series, pd.Series]:
    seen_supports: List[Tuple[date, float]] = []  # [(support date, support price)]
    seen_resistances: List[Tuple[date, float]] = []  # [(resistance date, resistance price)]
    prev_direction = 0  # 0 = flat, 1 = up, -1 = down

    prev_support_dates = pd.Series(index=prices_series.index, name=prices_series.name, dtype="datetime64[ns]")
    prev_support_prices = pd.Series(index=prices_series.index, name=prices_series.name)
    prev_resistance_dates = pd.Series(index=prices_series.index, name=prices_series.name, dtype="datetime64[ns]")
    prev_resistance_prices = pd.Series(index=prices_series.index, name=prices_series.name)

    def _get_direction(prev_price: float, price: float) -> int:
        if price > prev_price:
            return 1
        if price < prev_price:
            return -1
        return 0

    def _get_prev_support(prev_price: float) -> Tuple[date, float]:
        return next(
            (t for t in reversed(seen_supports) if t[1] < prev_price),
            (pd.NaT, np.nan)
        )

    def _get_prev_resistance(prev_price: float) -> Tuple[date, float]:
        return next(
            (t for t in reversed(seen_resistances) if t[1] > prev_price),
            (pd.NaT, np.nan)
        )

    for iloc in range(1, len(prices_series)):
        prev_date = prices_series.index[iloc - 1]
        prev_price = prices_series.iat[iloc - 1]
        price = prices_series.iat[iloc]
        direction = _get_direction(prev_price, price)

        # find last seen support / resistance
        prev_support_dates[prev_date], prev_support_prices[prev_date] = _get_prev_support(prev_price)
        prev_resistance_dates[prev_date], prev_resistance_prices[prev_date] = _get_prev_resistance(prev_price)

        # update seen supports and resistances (expanding window)
        if direction != 0:
            if direction == 1 and prev_direction == -1:
                seen_supports.append((prev_date, prev_price))
            elif direction == -1 and prev_direction == 1:
                seen_resistances.append((prev_date, prev_price))
            prev_direction = direction

    # need to handle last date after loop
    last_date, last_price = prices_series.index[-1], prices_series.iat[-1]
    prev_support_dates[last_date], prev_support_prices[last_date] = _get_prev_support(last_price)
    prev_resistance_dates[last_date], prev_resistance_prices[last_date] = _get_prev_resistance(last_price)

    return prev_support_dates, prev_support_prices, prev_resistance_dates, prev_resistance_prices


def variance(prices_df: pd.DataFrame, timeperiod=5) -> pd.Series:
    sma = prices_df.rolling(timeperiod, center=True).mean()
    return np.square((prices_df - sma) / sma * 100).sum() / len(prices_df)


def stability(prices_df: pd.DataFrame) -> pd.Series:
    signs = np.sign(prices_df.diff().replace(0, np.nan).ffill(axis=0).bfill(axis=0))
    tot_sign_changes = np.sign(signs.diff().shift(-1)).fillna(0).abs().sum(axis=0)
    return tot_sign_changes / len(prices_df)


def momentum(prices_df: pd.DataFrame, timeperiod=10) -> pd.DataFrame:
    return prices_df.apply(lambda p: talib.MOM(p, timeperiod=timeperiod)) / prices_df.shift(timeperiod)


def price_channels(prices_df: pd.DataFrame, timeperiod=25) -> Tuple[pd.DataFrame, pd.DataFrame]:
    return prices_df.rolling(timeperiod).min().shift(), prices_df.rolling(timeperiod).max().shift()
