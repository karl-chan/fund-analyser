from datetime import date

import matplotlib.pyplot as plt
import pandas as pd
from overrides import overrides

from lib.indicators.indicator_utils import bollinger_bands
from lib.simulate.stock_simulator import Confidence, StockHistory, StockSimulator, StockStrategy
from lib.stock import stock_cache


class AlwaysEntryStrategy(StockStrategy):
    @overrides
    def should_execute(self, dt: date, price_series: pd.Series, history: StockHistory) -> Confidence:
        return 1


class TrailingExitStrategy(StockStrategy):
    @overrides
    def should_execute(self, dt: date, price_series: pd.Series, history: StockHistory) -> Confidence:
        threshold = 0.02  # 2%
        bought_dt = history[-1].dt
        price_threshold = price_series[bought_dt:dt].expanding().max() * (1 - threshold)
        if price_series.at[dt] < price_threshold.at[dt]:
            return 1
        else:
            return 0


class BollingerHighEntryStrategy(StockStrategy):
    @overrides
    def should_execute(self, dt: date, price_series: pd.Series, history: StockHistory) -> Confidence:
        upper_band, middle_band, lower_band = bollinger_bands(price_series.to_frame())

        if price_series.at[dt] > upper_band.squeeze(axis=1)[dt]:
            return 1
        else:
            return 0


class BollingerLowEntryStrategy(StockStrategy):
    @overrides
    def should_execute(self, dt: date, price_series: pd.Series, history: StockHistory) -> Confidence:
        upper_band, middle_band, lower_band = bollinger_bands(price_series.to_frame(), stdev=0.5)

        if price_series.at[dt] < lower_band.squeeze(axis=1)[dt]:
            return 1
        else:
            return 0


class RisingEntryStrategy(StockStrategy):
    @overrides
    def should_execute(self, dt: date, price_series: pd.Series, history: StockHistory) -> Confidence:
        upper_band, middle_band, lower_band = bollinger_bands(price_series.to_frame(), stdev=0.5)

        if middle_band.squeeze(axis=1).diff()[dt] > 0:
            return 1
        else:
            return 0


if __name__ == "__main__":
    symbol = "aapl"
    open_df, high_df, low_df, close_df, volume_df = stock_cache.get_prices([symbol])

    start_date = date(2018, 1, 3)
    stock_simulator = StockSimulator(
        symbols=[symbol],
        entry_strategy=BollingerLowEntryStrategy(),  # AlwaysEntryStrategy(),
        exit_strategy=TrailingExitStrategy(),
    )
    balance = stock_simulator.run(start_date=start_date)
    aapl_adjusted = close_df.loc[start_date:, symbol] / close_df.loc[start_date, symbol] * balance.at[start_date]

    pd.concat([aapl_adjusted, balance], axis=1).plot()
    plt.show()
