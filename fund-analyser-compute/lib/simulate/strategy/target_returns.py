from __future__ import annotations

from datetime import date
from typing import List

import pandas as pd
from overrides import overrides

from lib.indicators.indicator_utils import price_channels
from lib.simulate.simulator import Simulator
from lib.simulate.strategy.strategy import Strategy
from lib.simulate.tiebreaker.max_upside_tie_breaker import MaxUpsideTieBreaker


class TargetReturns(Strategy):

    def __init__(self, target_returns) -> None:
        super().__init__()
        self._target_returns = target_returns

    def _with_upside(self, dt: date) -> List[str]:
        row = self.has_upside.loc[dt, :]
        isins = row.index[row].tolist()
        return isins

    def _with_global_uptrend(self, dt: date) -> List[str]:
        row = self.pos_gradient.loc[dt, :]
        isins = row.index[row].tolist()
        return isins

    @overrides
    def run(self, dt: date, prices_df: pd.DataFrame, fees_df: pd.DataFrame) -> List[str]:
        return list(set.intersection(
            set(self._with_upside(dt)),
            set(self._with_global_uptrend(dt))
        ))

    @overrides
    def on_data_ready(self, data: Simulator.Data) -> None:
        time_period_1m = 20
        lower_channel, upper_channel = price_channels(data.prices_df, timeperiod=time_period_1m)
        upsides = (upper_channel - data.prices_df) / data.prices_df
        self.has_upside = upsides.ge(self._target_returns)

        smoothed_prices_1m = data.prices_df.rolling(time_period_1m).mean()
        global_gradient = smoothed_prices_1m.pct_change()
        self.pos_gradient = global_gradient.ge(0)


if __name__ == "__main__":
    target_returns = 0.02
    simulator = Simulator(
        strategy=TargetReturns(target_returns=target_returns),
        tie_breaker=MaxUpsideTieBreaker()
    )
    result = simulator.run()
    Simulator.describe_and_plot([result])
