from typing import Tuple

import numpy as np
import pandas as pd
import talib
from rust_indicators import support_resistance_ilocs
from talib._ta_lib import MA_Type

from lib.util.pandas_utils import take_nan


def bollinger_bands(prices_df: pd.DataFrame, timeperiod=5, stdev=1) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    prices_arr = prices_df.to_numpy()
    upper_band, middle_band, lower_band = \
        np.empty_like(prices_arr), np.empty_like(prices_arr), np.empty_like(prices_arr)
    for col in range(prices_arr.shape[1]):
        upper_band[:, col], middle_band[:, col], lower_band[:, col] = talib.BBANDS(prices_arr[:, col],
                                                                                   timeperiod=timeperiod,
                                                                                   nbdevup=stdev, nbdevdn=stdev,
                                                                                   matype=MA_Type.SMA)
    return (pd.DataFrame(upper_band, dtype=prices_arr.dtype, index=prices_df.index, columns=prices_df.columns),
            pd.DataFrame(middle_band, dtype=prices_arr.dtype, index=prices_df.index, columns=prices_df.columns),
            pd.DataFrame(lower_band, dtype=prices_arr.dtype, index=prices_df.index, columns=prices_df.columns))


def adx(prices_df: pd.DataFrame, timeperiod=14) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    prices_arr = prices_df.to_numpy()
    adxs, plus_dis, minus_dis = \
        np.empty_like(prices_arr), np.empty_like(prices_arr), np.empty_like(prices_arr)
    for col in range(prices_arr.shape[1]):
        series = prices_arr[:, col]
        adxs[:, col] = talib.ADX(high=series, low=series, close=series, timeperiod=timeperiod)
        plus_dis[:, col] = talib.PLUS_DI(high=series, low=series, close=series, timeperiod=timeperiod)
        minus_dis[:, col] = talib.MINUS_DI(high=series, low=series, close=series, timeperiod=timeperiod)
    return (pd.DataFrame(adxs, dtype=prices_arr.dtype, index=prices_df.index, columns=prices_df.columns),
            pd.DataFrame(plus_dis, dtype=prices_arr.dtype, index=prices_df.index, columns=prices_df.columns),
            pd.DataFrame(minus_dis, dtype=prices_arr.dtype, index=prices_df.index, columns=prices_df.columns))


def ppo(prices_df: pd.DataFrame, fast=12, slow=26, signal=9) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    prices_arr = prices_df.to_numpy()
    ppos, pposignals = np.empty_like(prices_arr), np.empty_like(prices_arr)
    for col in range(prices_arr.shape[1]):
        ppos[:, col] = talib.PPO(prices_arr[:, col], fastperiod=fast, slowperiod=slow, matype=MA_Type.EMA)
        try:
            pposignals[:, col] = talib.EMA(ppo, timeperiod=signal)
        except:
            pposignals[:, col] = np.nan
    ppohists = ppos - pposignals
    return (pd.DataFrame(ppos, dtype=prices_arr.dtype, index=prices_df.index, columns=prices_df.columns),
            pd.DataFrame(pposignals, dtype=prices_arr.dtype, index=prices_df.index, columns=prices_df.columns),
            pd.DataFrame(ppohists, dtype=prices_arr.dtype, index=prices_df.index, columns=prices_df.columns))


def support_resistance(prices_df: pd.DataFrame) -> \
        Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    support_ilocs, resistance_ilocs = map(lambda ilocs: pd.DataFrame(np.transpose(ilocs),
                                                                     index=prices_df.index,
                                                                     columns=prices_df.columns),
                                          support_resistance_ilocs(np.transpose(prices_df.to_numpy())))
    index_df = prices_df.apply(lambda col: prices_df.index, axis=0)
    support_dates, resistance_dates = take_nan(index_df, support_ilocs), take_nan(index_df, resistance_ilocs)
    support_prices, resistance_prices = take_nan(prices_df, support_ilocs), take_nan(prices_df, resistance_ilocs)
    return support_dates, support_prices, resistance_dates, resistance_prices


def variance(prices_df: pd.DataFrame, timeperiod=5) -> pd.Series:
    sma = prices_df.rolling(timeperiod, center=True).mean()
    return np.square((prices_df - sma) / sma * 100).sum() / len(prices_df)


def stability(prices_df: pd.DataFrame) -> pd.Series:
    signs = np.sign(prices_df.diff().replace(0, np.nan).ffill(axis=0).bfill(axis=0))
    tot_sign_changes = np.sign(signs.diff().shift(-1)).fillna(0).abs().sum(axis=0)
    return tot_sign_changes / len(prices_df)


def momentum(prices_df: pd.DataFrame, timeperiod=10) -> pd.DataFrame:
    prices_arr = prices_df.to_numpy()
    moms = np.empty_like(prices_arr)
    for col in range(prices_arr.shape[1]):
        moms[:, col] = talib.MOM(prices_arr[:, col], timeperiod=timeperiod)
    return pd.DataFrame(moms, dtype=prices_arr.dtype, index=prices_df.index,
                        columns=prices_df.columns) / prices_df.shift(timeperiod)


def price_channels(prices_df: pd.DataFrame, timeperiod=25) -> Tuple[pd.DataFrame, pd.DataFrame]:
    return prices_df.rolling(timeperiod).min().shift(), prices_df.rolling(timeperiod).max().shift()
