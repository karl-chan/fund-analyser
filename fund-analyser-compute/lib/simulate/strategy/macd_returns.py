from __future__ import annotations

from datetime import date
from typing import List

import pandas as pd
from overrides import overrides

from lib.indicators.indicator_utils import ppo
from lib.simulate.simulator import Simulator
from lib.simulate.strategy.strategy import Strategy


class MacdReturns(Strategy):

    def _macd_fast_and_slow(self, dt: date) -> List[str]:
        formula = pd.concat(
            [
                self._slow_ppo.loc[dt, :],
                self._fast_ppo.loc[dt, :],
                (1 + self._slow_ppo.loc[dt, :]) * (1 + self._fast_ppo.loc[dt, :])
            ],
            axis=1)
        isins = formula[
                    (formula.iloc[:, 0] > 0) &
                    (formula.iloc[:, 1] > 0) &
                    (formula.iloc[:, 2] > 0)
                    ].iloc[:, 2] \
            .nlargest(num_portfolio).index.tolist()
        return isins

    @overrides
    def run(self, dt: date, prices_df: pd.DataFrame, fees_df: pd.DataFrame) -> List[str]:
        return self._macd_fast_and_slow(dt)

    @overrides
    def on_data_ready(self, data: Simulator.Data) -> None:
        self._slow_ppo, self._slow_pposignal, self._slow_ppohist = ppo(data.prices_df, fast=20, slow=60)
        self._fast_ppo, self._fast_pposignal, self._fast_ppohist = ppo(data.prices_df, fast=3, slow=6)


if __name__ == "__main__":
    num_portfolio = 1
    simulator = Simulator(
        strategy=MacdReturns(),
        num_portfolio=num_portfolio
    )
    result = simulator.run()
    Simulator.describe_and_plot([result])
