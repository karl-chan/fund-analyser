import logging
import sys
from datetime import date, datetime

import matplotlib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from ffn import calc_max_drawdown
from overrides import overrides

from lib.indicators.indicator_utils import bollinger_bands
from lib.stock import stock_cache
from lib.stocksimulate.stock_history import last_bought_date, TradeHistory
from lib.stocksimulate.stock_simulator import StockSimulator
from lib.stocksimulate.strategy.stock_strategy import Confidences, StockStrategy
from lib.util.dates import BDAY
from lib.util.logging_utils import log_debug


class AlwaysEntryStrategy(StockStrategy):
    @overrides
    def should_execute(self, dt: date, prices_df: pd.DataFrame, history: TradeHistory) -> Confidences:
        return {symbol: 1 for symbol in prices_df.columns}


class TrailingExitStrategy(StockStrategy):
    @overrides
    def should_execute(self, dt: date, prices_df: pd.DataFrame, history: TradeHistory) -> Confidences:
        threshold = 0.05  # 5%
        log_debug(f"Trailing exit for date {dt}")

        prices_df_since_bought = prices_df.copy()
        for symbol in prices_df.columns:
            bought_dt = last_bought_date(symbol, history)
            prices_df_since_bought.loc[:bought_dt, :] = np.nan  # type: ignore
        thresholds = prices_df_since_bought.loc[:dt, :].max() * (1 - threshold)  # type: ignore

        return prices_df.loc[dt, :].lt(thresholds).astype('int').to_dict()


class BollingerLowEntryStrategy(StockStrategy):
    @overrides
    def should_execute(self, dt: date, prices_df: pd.DataFrame, history: TradeHistory) -> Confidences:
        log_debug(f"BollingerLowEntryStrategy for date: {dt}")
        upper_band, middle_band, lower_band = bollinger_bands(prices_df, stdev=1)
        cond = prices_df.lt(lower_band) & prices_df.diff().gt(0)
        return cond.loc[dt, :].astype('int').to_dict()


class BollingerHighExitStrategy(StockStrategy):
    @overrides
    def should_execute(self, dt: date, prices_df: pd.DataFrame, history: TradeHistory) -> Confidences:
        upper_band, middle_band, lower_band = bollinger_bands(prices_df)
        return prices_df.gt(upper_band).loc[dt, :].astype('int').to_dict()


class RisingEntryStrategy(StockStrategy):
    @overrides
    def should_execute(self, dt: date, prices_df: pd.DataFrame, history: TradeHistory) -> Confidences:
        return prices_df.pct_change().gt(0.02).loc[dt, :].astype('int').to_dict()


class AbsRisingEntryStrategy(StockStrategy):
    @overrides
    def should_execute(self, dt: date, prices_df: pd.DataFrame, history: TradeHistory) -> Confidences:
        window = prices_df.loc[dt - 2 * BDAY: dt, :]  # type: ignore
        pct_change = (window.iloc[-1] - window.iloc[0]) / window.iloc[0]
        return pct_change.gt(0).astype('int').to_dict()


class AbsFallingExitStrategy(StockStrategy):
    @overrides
    def should_execute(self, dt: date, prices_df: pd.DataFrame, history: TradeHistory) -> Confidences:
        window = prices_df.loc[dt - BDAY: dt, :]  # type: ignore
        pct_change = (window.iloc[-1] - window.iloc[0]) / window.iloc[0]
        return pct_change.lt(0.03).astype('int').to_dict()


class HoldingDaysExitStrategy(StockStrategy):
    @overrides
    def should_execute(self, dt: date, prices_df: pd.DataFrame, history: TradeHistory) -> Confidences:
        hold_days = 5  # business days
        confidences: Confidences = {}
        for symbol in prices_df.columns:
            bought_dt = last_bought_date(symbol, history)
            if bought_dt + hold_days * BDAY <= dt:
                confidences[symbol] = 1
            else:
                confidences[symbol] = 0
        return confidences


def _describe_and_plot(account: pd.DataFrame) -> None:
    # set display mode and suppress useless warnings
    matplotlib.use("Qt5Agg" if sys.platform == "darwin" else "TkAgg")
    logging.getLogger("matplotlib.font_manager").setLevel(logging.INFO)

    balance = account["value"]
    print(f"Account:\n{account.to_string()}")
    print(f"Max drawdown: {calc_max_drawdown(balance)}")
    balance.plot()
    plt.show()


if __name__ == "__main__":
    symbols = None
    prices_df, open_df, high_df, low_df, close_df, volume_df = stock_cache.get_prices(symbols)
    symbols = tuple(prices_df.columns)

    start_date = datetime(2001, 1, 1)
    stock_simulator = StockSimulator(
        symbols=symbols,
        entry_strategy=BollingerLowEntryStrategy(),
        exit_strategy=HoldingDaysExitStrategy()  # TrailingExitStrategy(),
    )
    account, history = stock_simulator.run(start_date=start_date)
    balance = account["value"]
    stocks_adjusted = prices_df.loc[
                      start_date:, symbols  # type: ignore
                      ] / prices_df.loc[
                          start_date:start_date, symbols  # type: ignore
                          ].squeeze() * balance.at[start_date]

_describe_and_plot(account)
# pd.concat([stocks_adjusted, balance], axis=1).plot()
