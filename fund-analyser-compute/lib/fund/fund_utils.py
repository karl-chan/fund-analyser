from datetime import datetime
from typing import List, Tuple

import numpy as np
import pandas as pd
import talib
from talib._ta_lib import MA_Type

from lib.fund.fund import Fund
from lib.util import properties


def merge_funds_historic_prices(funds: List[Fund], start=None, end=None) -> pd.DataFrame:
    all_prices = []
    for fund in funds:
        prices = fund.historicPrices.copy(deep=False)
        prices.name = fund.isin
        all_prices.append(prices)
    return pd.concat(all_prices, axis=1).resample("B").asfreq().fillna(method="ffill").truncate(before=start, after=end)


def calc_returns(prices_df: pd.DataFrame, dt: datetime, duration: pd.DateOffset, fees_df: pd.DataFrame) -> pd.DataFrame:
    window = prices_df[dt - duration: dt]
    returns_before_fees = (window.iloc[-1] - window.iloc[0]) / window.iloc[0]
    returns_after_fees = returns_before_fees * (1 - fees_df["total"])
    return returns_after_fees


def calc_fees(funds: List[Fund]) -> pd.DataFrame:
    platform_charge = properties.get("fund.fees.platform.charge")
    fees = pd.DataFrame(
        [[fund.ocf, fund.amc, fund.entryCharge, fund.exitCharge, fund.bidAskSpread, platform_charge] for fund in funds],
        index=[fund.isin for fund in funds],
        columns=["ocf", "amc", "entry_charge", "exit_charge", "bid_ask_spread", "platform_charge"]
    )
    fees.loc[:, "total"] = fees[["ocf", "entry_charge", "exit_charge", "bid_ask_spread", "platform_charge"]].sum(axis=1)
    return fees


def bollinger_bands(prices_df: pd.DataFrame, timeperiod=5, stdev=1) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    upper_bands, middle_bands, lower_bands = [], [], []
    for (isin, series) in prices_df.items():
        upper_band, middle_band, lower_band = talib.BBANDS(series, timeperiod=timeperiod, nbdevup=stdev, nbdevdn=stdev,
                                                           matype=MA_Type.SMA)
        upper_band.name, middle_band.name, lower_band.name = (isin,) * 3
        upper_bands.append(upper_band)
        middle_bands.append(middle_band)
        lower_bands.append(lower_band)

    return tuple(map(lambda s: pd.concat(s, axis=1), (upper_bands, middle_bands, lower_bands)))


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
    return tuple(map(lambda s: pd.concat(s, axis=1), (adxs, plus_dis, minus_dis)))


def ppo(prices_df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    fast, slow, signal = 12, 26, 9
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
    return tuple(map(lambda s: pd.concat(s, axis=1), (ppos, pposignals, ppohists)))


# 1 = support, 0 = none, -1 = resistance
def support_resistance(prices_df: pd.DataFrame) -> pd.DataFrame:
    signs = np.sign(prices_df.diff().replace(0, np.nan).ffill(axis=0).bfill(axis=0))
    return np.sign(signs.diff().shift(-1)).fillna(0).astype("int")


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
