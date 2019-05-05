from datetime import datetime
from typing import List, Tuple

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
    return pd.concat(all_prices, axis=1).resample("D").asfreq().fillna(method="ffill").truncate(before=start, after=end)


def calc_returns(prices_df: pd.DataFrame, dt: datetime, duration: pd.DateOffset, fees_df: pd.DataFrame) -> pd.DataFrame:
    window = prices_df[dt - duration: dt]
    returns_before_fees = (window.iloc[-1] - window.iloc[0]) / window.iloc[0]
    returns_after_fees = returns_before_fees * (1 - fees_df["total"])
    return returns_after_fees


def calc_fees(funds: List[Fund]) -> pd.DataFrame:
    platform_charge = properties.get("fund.fees.platform.charge")
    fees = pd.DataFrame(
        [[fund.ocf, fund.amc, fund.entryCharge, fund.exitCharge, platform_charge] for fund in funds],
        index=[fund.isin for fund in funds],
        columns=["ocf", "amc", "entry_charge", "exit_charge", "platform_charge"]
    )
    fees.loc[:, "total"] = fees[["ocf", "entry_charge", "exit_charge", "platform_charge"]].sum(axis=1)
    return fees


def bollinger_bands(prices_df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    upper_bands, middle_bands, lower_bands = [], [], []
    for (isin, series) in prices_df.items():
        upper_band, middle_band, lower_band = talib.BBANDS(series, timeperiod=5, nbdevup=1, nbdevdn=1,
                                                           matype=MA_Type.SMA)
        upper_band.name, middle_band.name, lower_band.name = (isin,) * 3
        upper_bands.append(upper_band)
        middle_bands.append(middle_band)
        lower_bands.append(lower_band)

    return tuple(map(lambda s: pd.concat(s, axis=1), (upper_bands, middle_bands, lower_bands)))
