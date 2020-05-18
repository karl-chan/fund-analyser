from datetime import date
from typing import List

import pandas as pd
from overrides import overrides

from lib.indicators.indicator_utils import support_resistance
from lib.simulate.simulator import Simulator
from lib.simulate.strategy.strategy import Strategy
from lib.simulate.tiebreaker.max_upside_tie_breaker import MaxUpsideTieBreaker


class UpsideRatioReturns(Strategy):

    @overrides
    def run(self, dt: date, prices_df: pd.DataFrame, fees_df: pd.DataFrame) -> List[str]:
        return self._with_upside_ratio(dt)

    def _with_upside_ratio(self, dt: date) -> List[str]:
        row = self._has_upside_ratio.loc[dt, :]
        isins = row.index[row].tolist()
        return isins

    def on_data_ready(self, data: Simulator.Data) -> None:
        smoothed_prices = data.prices_df.rolling(2).mean()

        self._prev_support_dates, \
        self._prev_support_prices, \
        self._prev_resistance_dates, \
        self._prev_resistance_prices \
            = support_resistance(smoothed_prices)

        upside_ratio = (self._prev_resistance_prices - data.prices_df) / (
                data.prices_df - self._prev_support_prices)
        self._has_upside_ratio = upside_ratio.ge(2)


if __name__ == "__main__":
    simulator = Simulator(
        strategy=UpsideRatioReturns(),
        tie_breaker=MaxUpsideTieBreaker(),
    )
    results = simulator.run()
    Simulator.describe_and_plot(results)
