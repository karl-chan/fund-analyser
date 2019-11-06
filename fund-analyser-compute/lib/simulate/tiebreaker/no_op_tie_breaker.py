import sys
from datetime import date
from typing import List

import pandas as pd

from lib.simulate.tiebreaker.max_returns_tie_breaker import MaxReturnsTieBreaker


class NoOpTieBreaker(MaxReturnsTieBreaker):

    def run(self, allowed_isins: List[str], num_portfolio: int, dt: date, prices_df: pd.DataFrame,
            fees_df: pd.DataFrame) -> List[str]:
        return super().run(allowed_isins,
                           sys.maxsize,  # unlimited
                           dt,
                           prices_df,
                           fees_df)
