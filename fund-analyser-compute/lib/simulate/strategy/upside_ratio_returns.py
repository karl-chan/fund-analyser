from datetime import date
from typing import List

import numpy as np
import pandas as pd
from overrides import overrides

from lib.indicators.indicator_utils import support_resistance
from lib.simulate.simulator import Simulator
from lib.simulate.strategy.strategy import Strategy
from lib.util.lang import intersection


class UpsideRatioReturns(Strategy):

    @overrides
    def run(self, dt: date, prices_df: pd.DataFrame, fees_df: pd.DataFrame) -> List[str]:
        isins = intersection(
            self._with_upside_ratio(dt),
            self._is_rising(dt),
            self._with_margin(dt),
        )
        return isins

    def _with_upside_ratio(self, dt: date) -> List[str]:
        row = self._has_upside_ratio.loc[dt, :]
        isins = row.index[row].tolist()
        return isins

    def _is_rising(self, dt: date) -> List[str]:
        up = self._rising.loc[dt]
        isins = up.index[up].tolist()
        return isins

    def _with_margin(self, dt: date) -> List[str]:
        row = self._has_margin.loc[dt]
        isins = row.index[row].tolist()
        return isins

    def on_data_ready(self, data: Simulator.Data) -> None:
        smoothed_prices = data.prices_df.rolling(14).mean()

        self._prev_support_dates, \
        self._prev_support_prices, \
        self._prev_resistance_dates, \
        self._prev_resistance_prices \
            = support_resistance(smoothed_prices)

        upside_ratio = (self._prev_resistance_prices - data.prices_df) / (
                data.prices_df - self._prev_support_prices)
        upside_ratio[self._prev_resistance_prices.isna() & ~self._prev_support_prices.isna()] = np.inf

        margin = (self._prev_resistance_prices - self._prev_support_prices) / self._prev_support_prices
        margin[self._prev_resistance_prices.isna() & ~self._prev_support_prices.isna()] = np.inf

        self._has_upside_ratio = upside_ratio.ge(2)
        self._has_margin = margin.ge(0.05)  # 5%
        self._rising = smoothed_prices.diff(periods=1).gt(0)


if __name__ == "__main__":
    simulator = Simulator(
        strategy=UpsideRatioReturns()
    )
    results = simulator.run()
    Simulator.describe_and_plot(results)
