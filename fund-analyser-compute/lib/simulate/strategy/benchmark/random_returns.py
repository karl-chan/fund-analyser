from datetime import date
from typing import List

import pandas as pd

from lib.simulate import simulator
from lib.simulate.simulator import Simulator
from lib.simulate.strategy.strategy import SelectAll
from lib.simulate.tiebreaker.tie_breaker import TieBreaker


class RandomTieBreaker(TieBreaker):

    def run(self, allowed_isins: List[str], num_portfolio: int, dt: date, prices_df: pd.DataFrame,
            fees_df: pd.DataFrame) -> List[str]:
        return prices_df.loc[dt].dropna().sample(num_portfolio).index.tolist()

    def on_data_ready(self, data: simulator.Simulator.Data) -> None:
        pass


if __name__ == "__main__":
    num_runs = 10
    simulator = Simulator(
        strategy=SelectAll(),
        tie_breaker=RandomTieBreaker()
    )

    results = [simulator.run() for i in range(num_runs)]
    Simulator.describe_and_plot(results)
