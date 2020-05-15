from datetime import date
from typing import List

import pandas as pd
from overrides import overrides

from lib.fund.fund_utils import calc_returns
from lib.simulate import simulator
from lib.simulate.tiebreaker.tie_breaker import TieBreaker
from lib.util.logging_utils import log_debug


class MaxReturnsTieBreaker(TieBreaker):

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
        max_isins = restricted_returns.nlargest(num_portfolio).index.tolist()
        log_debug(f"Dt: {dt} {max_isins} Past: {restricted_returns[max_isins].mean()}")
        return max_isins

    @overrides
    def on_data_ready(self, data: simulator.Simulator.Data) -> None:
        pass
