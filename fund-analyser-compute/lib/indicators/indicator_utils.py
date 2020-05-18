from typing import Tuple

import numpy as np
import pandas as pd
import talib
from rust_indicators import support_resistance_ilocs
from talib._ta_lib import MA_Type

from lib.util.pandas_utils import take_nan


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
    return prices_df.apply(lambda p: talib.MOM(p, timeperiod=timeperiod)) / prices_df.shift(timeperiod)


def price_channels(prices_df: pd.DataFrame, timeperiod=25) -> Tuple[pd.DataFrame, pd.DataFrame]:
    return prices_df.rolling(timeperiod).min().shift(), prices_df.rolling(timeperiod).max().shift()
