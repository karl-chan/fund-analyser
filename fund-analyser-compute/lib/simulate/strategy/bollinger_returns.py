from __future__ import annotations

from datetime import date
from typing import List

import pandas as pd
from overrides import overrides

from lib.indicators.indicator_utils import bollinger_bands
from lib.simulate.simulator import Simulator
from lib.simulate.strategy.strategy import Strategy
from lib.util.dates import BDAY


class BollingerReturns(Strategy):

    def _avoid_bollinger_top_t_1(self, dt: date, prices_df: pd.DataFrame) -> List[str]:
        ytd = dt - BDAY
        ytd_below_lower_band = self._below_lower_band.loc[ytd, :]
        ytd_isins = ytd_below_lower_band[ytd_below_lower_band].index

        up = self._rising.loc[dt, :]
        isins = up.index[up]
        return ytd_isins.intersection(isins)

    def _avoid_bollinger_top(self, dt: date, prices_df: pd.DataFrame) -> List[str]:
        dt_below_lower_band = self._below_lower_band.loc[dt, :]
        isins = dt_below_lower_band[dt_below_lower_band].index.tolist()
        return isins

    @overrides
    def run(self, dt: date, prices_df: pd.DataFrame, fees_df: pd.DataFrame) -> List[str]:
        return self._avoid_bollinger_top(dt, prices_df)
        # return self._avoid_bollinger_top_t_1(dt, prices_df)

    @overrides
    def on_data_ready(self, data: Simulator.Data) -> None:
        upper_bands, middle_bands, lower_bands = bollinger_bands(data.prices_df, stdev=1)
        self._below_lower_band = data.prices_df < lower_bands
        self._rising = data.prices_df.pct_change().gt(0)


if __name__ == "__main__":
    simulator = Simulator(
        strategy=BollingerReturns(),
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
