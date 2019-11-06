from __future__ import annotations

from datetime import date
from typing import List

import pandas as pd
from overrides import overrides

from lib.fund.fund_utils import calc_returns
from lib.simulate.simulator import Simulator
from lib.simulate.strategy.strategy import Strategy


class MomentumReturns(Strategy):

    def _require_positive_returns(self, dt: date, prices_df: pd.DataFrame, fees_df: pd.DataFrame) -> List[str]:
        periods = [pd.DateOffset(months=n) for n in (3, 2, 1)] \
                  + [pd.DateOffset(weeks=n) for n in (2, 1)]
        returns = pd.concat([calc_returns(prices_df, dt, duration, fees_df) for duration in periods], axis=1)
        positive_returns_indices = (returns > 0).all(axis=1)
        isins = returns.index[positive_returns_indices].tolist()
        return isins

    def _avoid_downtrend(self, dt: date) -> List[str]:
        upward = self._global_convexity_signs.loc[dt, :]
        isins = upward[upward].index.tolist()
        return isins

    @overrides
    def run(self, dt: date, prices_df: pd.DataFrame, fees_df: pd.DataFrame) -> List[str]:
        isins1 = self._require_positive_returns(dt, prices_df, fees_df)
        isins2 = self._avoid_downtrend(dt)
        return list(set.intersection(*map(set, [isins1, isins2])))

    @overrides
    def on_data_ready(self, data: Simulator.Data) -> None:
        smoothed_prices = data.prices_df.rolling(2).mean()
        global_gradient = smoothed_prices.pct_change()
        global_convexity = global_gradient.diff()
        self._global_convexity_signs = global_convexity > 0


if __name__ == "__main__":
    simulator = Simulator(
        strategy=MomentumReturns()
    )
    result = simulator.run()
    Simulator.describe_and_plot([result])
