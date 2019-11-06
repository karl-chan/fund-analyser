from datetime import date
from typing import List

import pandas as pd
from overrides import overrides

from lib.fund.fund_utils import calc_returns
from lib.indicators.indicator_utils import price_channels
from lib.simulate import simulator
from lib.simulate.tiebreaker.tie_breaker import TieBreaker


class MaxUpsideTieBreaker(TieBreaker):

    def __init__(self, lookback=pd.DateOffset(months=6)) -> None:
        self._lookback = lookback

    @overrides
    def run(self,
            allowed_isins: List[str],
            num_portfolio: int,
            dt: date,
            prices_df: pd.DataFrame,
            fees_df: pd.DataFrame) -> List[str]:
        restricted_returns = calc_returns(prices_df[allowed_isins], dt, self._lookback, fees_df)
        max_isins = self._upsides.loc[dt, allowed_isins].nlargest(num_portfolio).index
        print(f"Dt: {dt} {max_isins} Past: {restricted_returns[max_isins].mean()}")
        return max_isins

    @overrides
    def on_data_ready(self, data: simulator.Simulator.Data) -> None:
        price_channel_1m = 20
        lower_channel, upper_channel = price_channels(data.prices_df, timeperiod=price_channel_1m)
        self._upsides = (upper_channel - data.prices_df) / data.prices_df
