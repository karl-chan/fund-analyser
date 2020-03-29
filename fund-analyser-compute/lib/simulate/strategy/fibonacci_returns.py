from __future__ import annotations

from datetime import date
from typing import List

import pandas as pd
from overrides import overrides

from lib.indicators.indicator_utils import support_resistance
from lib.simulate.simulator import Simulator
from lib.simulate.strategy.strategy import Strategy
from lib.util.lang import intersection


class FibonacciReturns(Strategy):

    def _above_38(self, dt: date, prices_df: pd.DataFrame) -> List[str]:
        prev_support_prices = self._prev_support_prices.loc[dt]
        prev_resistance_prices = self._prev_resistance_prices.loc[dt]
        prices = prices_df.loc[dt]
        return prices.index[
            (prices - prev_support_prices) / (prev_resistance_prices - prev_support_prices) >= 0.38].tolist()

    def _below_62(self, dt: date, prices_df: pd.DataFrame) -> List[str]:
        prev_support_prices = self._prev_support_prices.loc[dt]
        prev_resistance_prices = self._prev_resistance_prices.loc[dt]
        prices = prices_df.loc[dt]
        return prices.index[
            (prices - prev_support_prices) / (prev_resistance_prices - prev_support_prices) <= 0.62].tolist()

    def _large_gap(self, dt: date, prices_df: pd.DataFrame) -> List[str]:
        target = 0.02  # 2%
        large_gap = self._gap_prices_pct.loc[dt] >= target
        return large_gap.index[large_gap].tolist()

    def _is_rising(self, dt: date) -> List[str]:
        up = self._rising.loc[dt]
        isins = up.index[up].tolist()
        return isins

    @overrides
    def run(self, dt: date, prices_df: pd.DataFrame, fees_df: pd.DataFrame) -> List[str]:
        isins = intersection(
            self._above_38(dt, prices_df),
            self._below_62(dt, prices_df),
            self._large_gap(dt, prices_df),
            self._is_rising(dt)
        )
        return isins

    @overrides
    def on_data_ready(self, data: Simulator.Data) -> None:
        smoothed_prices = data.prices_df.rolling(2).mean()

        sr, \
        self._prev_support_dates, \
        self._prev_support_prices, \
        self._prev_resistance_dates, \
        self._prev_resistance_prices \
            = support_resistance(data.prices_df)

        # sr = support_resistance(smoothed_prices)
        self._rising = smoothed_prices.diff().gt(0)
        self._gap_prices_pct = (self._prev_resistance_prices - self._prev_support_prices) / self._prev_support_prices


if __name__ == "__main__":
    simulator = Simulator(
        strategy=FibonacciReturns(),
    )
    results = simulator.run()
    Simulator.describe_and_plot(results)
