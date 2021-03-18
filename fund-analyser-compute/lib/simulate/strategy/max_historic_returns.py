from __future__ import annotations

from datetime import date
from typing import List

import pandas as pd
from overrides import overrides

from lib.fund.fund_utils import calc_returns
from lib.simulate.simulator import Simulator
from lib.simulate.strategy.strategy import Strategy


class MaxHistoricReturns(Strategy):

    def __init__(self, lookback=pd.DateOffset(weeks=2), num_portfolio=1) -> None:
        super().__init__()
        self._lookback = lookback
        self._num_portfolio = num_portfolio

    def _max_historic_returns(self, dt: date, prices_df: pd.DataFrame, fees_df: pd.DataFrame) -> List[str]:
        returns = calc_returns(prices_df, dt, self._lookback, fees_df)
        isins = returns.nlargest(self._num_portfolio).index.tolist()
        return isins

    @overrides
    def run(self, dt: date, prices_df: pd.DataFrame, fees_df: pd.DataFrame) -> List[str]:
        return self._max_historic_returns(dt, prices_df, fees_df)

    @overrides
    def on_data_ready(self, data: Simulator.Data) -> None:
        pass
