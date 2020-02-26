from datetime import date
from typing import List

import pandas as pd
from overrides import overrides

from lib.simulate.simulator import Simulator
from lib.simulate.strategy.bollinger_returns import BollingerReturns
from lib.simulate.strategy.strategy import Strategy
from lib.simulate.strategy.target_returns import TargetReturns
from lib.util.lang import intersection


class AndStrategy(Strategy):

    def __init__(self, *strategies: Strategy):
        self.strategies = strategies

    @overrides
    def run(self, dt: date, prices_df: pd.DataFrame, fees_df: pd.DataFrame) -> List[str]:
        return intersection(
            *(strategy.run(dt, prices_df, fees_df) for strategy in self.strategies)
        )

    @overrides
    def on_data_ready(self, data: Simulator.Data) -> None:
        for strategy in self.strategies:
            strategy.on_data_ready(data)


if __name__ == "__main__":
    simulator = Simulator(
        strategy=AndStrategy(
            BollingerReturns(),
            TargetReturns()
        ),
        isins=[
            "GB00B1XFGM25",
            "GB00B4TZHH95",
            "GB00B8JYLC77",
            # "GB00B39RMM81",
            "GB00B80QG615",
            "GB00B99C0657",
            # "GB00BH57C751",
            "GB0006061963",
            # "IE00B4WL8048",
            "IE00B90P3080",
            "LU0827884411",
        ]
    )
    results = simulator.run()
    Simulator.describe_and_plot(results)
