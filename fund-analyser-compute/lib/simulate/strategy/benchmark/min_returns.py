from datetime import date
from typing import List

import pandas as pd
from overrides import overrides

from lib.fund.fund_utils import calc_returns
from lib.simulate.simulator import Simulator
from lib.simulate.strategy.strategy import Strategy
from lib.simulate.tiebreaker.no_op_tie_breaker import NoOpTieBreaker


class MinReturns(Strategy):

    @overrides
    def run(self, dt: date, prices_df: pd.DataFrame, fees_df: pd.DataFrame) -> List[str]:
        next_dt = dt + self._hold_interval
        next_returns = calc_returns(prices_df, next_dt, self._hold_interval, fees_df)
        isin = next_returns.idxmin()
        return [isin]

    @overrides
    def on_data_ready(self, data: Simulator.Data) -> None:
        self._hold_interval = data.hold_interval


if __name__ == "__main__":
    simulator = Simulator(
        strategy=MinReturns(),
        tie_breaker=NoOpTieBreaker(),
        num_portfolio=1
    )
    results = simulator.run()
    Simulator.describe_and_plot(results)
