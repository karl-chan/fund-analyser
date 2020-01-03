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

    def __init__(self, target_returns=0.02) -> None:
        super().__init__()
        self._target_returns = target_returns

    def _with_upside(self, dt: date) -> List[str]:
        row = self.has_upside.loc[dt, :]
        isins = row.index[row].tolist()
        return isins

    @overrides
    def run(self, dt: date, prices_df: pd.DataFrame, fees_df: pd.DataFrame) -> List[str]:
        return list(set.intersection(
            set(self._with_upside(dt))
        ))

    @overrides
    def on_data_ready(self, data: Simulator.Data) -> None:
        time_period_1m = 20
        lower_channel, upper_channel = price_channels(data.prices_df, timeperiod=time_period_1m)
        upsides = (upper_channel - data.prices_df) / data.prices_df
        self.has_upside = upsides.ge(self._target_returns)


if __name__ == "__main__":
    simulator = Simulator(
        strategy=TargetReturns(),
        tie_breaker=MaxUpsideTieBreaker(),
    )
    result = simulator.run()
    Simulator.describe_and_plot([result])
