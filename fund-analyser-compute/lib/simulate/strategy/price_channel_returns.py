from __future__ import annotations

from datetime import date
from typing import List

import pandas as pd
from overrides import overrides

from lib.indicators.indicator_utils import price_channels
from lib.simulate.simulator import Simulator
from lib.simulate.strategy.strategy import Strategy
from lib.util.dates import BDAY


class PriceChannelReturns(Strategy):

    def _exit_price_channel(self, dt: date, prices_df: pd.DataFrame) -> List[str]:
        ytd = dt - BDAY
        ytd_cond = prices_df.loc[ytd, :] < self._upper_channel.loc[ytd, :]
        ytd_isins = prices_df.loc[ytd, :][ytd_cond].index

        today_cond = prices_df.loc[dt, :] > self._upper_channel.loc[dt, :]
        today_isins = prices_df.loc[dt, :][today_cond].index
        return ytd_isins.intersection(today_isins)

    def _enter_price_channel(self, dt: date, prices_df: pd.DataFrame) -> List[str]:
        ytd = dt - BDAY
        ytd_cond = prices_df.loc[ytd, :] < self._lower_channel.loc[ytd, :]
        ytd_isins = prices_df.loc[ytd, :][ytd_cond].index

        today_cond = prices_df.loc[dt, :] > self._lower_channel.loc[dt, :]
        today_isins = prices_df.loc[dt, :][today_cond].index
        return ytd_isins.intersection(today_isins)

    def _exit_or_enter_price_channel(self, dt: date, prices_df: pd.DataFrame) -> List[str]:
        return list(
            set(self._exit_price_channel(dt, prices_df))
                .union(set(self._enter_price_channel(dt, prices_df)))
        )

    def _rebound_within_channel(self, dt: date) -> List[str]:
        all_btw_channel = self._btw_channel.loc[dt - 2 * BDAY: dt, :].all(axis=0)
        all_isins = all_btw_channel.index[all_btw_channel]

        ytd_returns = self._daily_returns.loc[dt - BDAY, :]
        today_returns = self._daily_returns.loc[dt, :]
        ytd_isins = ytd_returns[ytd_returns < 0].index
        today_isins = today_returns[today_returns > 0].index

        return list(set.intersection(
            set(all_isins),
            set(ytd_isins),
            set(today_isins)
        ))

    @overrides
    def run(self, dt: date, prices_df: pd.DataFrame, fees_df: pd.DataFrame) -> List[str]:
        return self._rebound_within_channel(dt)

    @overrides
    def on_data_ready(self, data: Simulator.Data) -> None:
        self._lower_channel, self._upper_channel = price_channels(data.prices_df, timeperiod=25)
        self._btw_channel = (self._lower_channel < data.prices_df) & (data.prices_df < self._upper_channel)
        self._daily_returns = data.prices_df.pct_change()


if __name__ == "__main__":
    simulator = Simulator(
        strategy=PriceChannelReturns(),
    )
    result = simulator.run()
    Simulator.describe_and_plot([result])
