from __future__ import annotations

from datetime import date
from typing import List

import pandas as pd
from overrides import overrides

from lib.indicators.indicator_utils import bollinger_bands
from lib.simulate.simulator import Simulator
from lib.simulate.strategy.strategy import Strategy
from lib.util.date import BDAY


class BollingerReturns(Strategy):
    def _avoid_bollinger_top_t_1(self, dt: date, prices_df: pd.DataFrame) -> List[str]:
        ytd = dt - BDAY
        ytd_prices_series = prices_df.loc[ytd, :]
        ytd_lower_band_series = self._lower_band.loc[ytd, :]
        ytd_isins = ytd_prices_series[ytd_prices_series <= ytd_lower_band_series].index

        up = self._rising.loc[dt, :]
        isins = up.index[up]
        return ytd_isins.intersection(isins)

    def _avoid_bollinger_top(self, dt: date, prices_df: pd.DataFrame) -> List[str]:
        prices_series = prices_df.loc[dt, :]
        lower_band_series = self._lower_band.loc[dt, :]
        isins = prices_series[prices_series <= lower_band_series].index.tolist()
        return isins

    @overrides
    def run(self, dt: date, prices_df: pd.DataFrame, fees_df: pd.DataFrame) -> List[str]:
        return self._avoid_bollinger_top(dt, prices_df)
        # return self._avoid_bollinger_top_t_1(dt, prices_df)

    @overrides
    def on_data_ready(self, data: Simulator.Data) -> None:
        self._upper_band, self._middle_band, self._lower_band = bollinger_bands(data.prices_df, stdev=1)
        self._rising = data.prices_df.pct_change().gt(0)


if __name__ == "__main__":
    simulator = Simulator(
        strategy=BollingerReturns(),
        isins=[
            "GB00B1XFGM25",
            "GB00B4TZHH95",
            "GB00B8JYLC77",
            "GB00B39RMM81",
            "GB00B80QG615",
            "GB00B99C0657",
            # "GB00BH57C751",
            "GB0006061963",
            "IE00B4WL8048",  #
            "IE00B90P3080",
            "LU0827884411",
        ]
    )
    result = simulator.run()
    Simulator.describe_and_plot([result])
