from abc import ABC, abstractmethod
from collections import defaultdict
from datetime import date
from enum import Enum
from typing import Dict, Iterable, List, NamedTuple, Set

import pandas as pd

from lib.stock import stock_cache

Confidence = float


class StockSide(Enum):
    BUY = "buy"
    SELL = "sell"


class StockAction(NamedTuple):
    side: StockSide
    dt: date
    shares: float


StockHistory = List[StockAction]


class StockStrategy(ABC):
    @abstractmethod
    # return range between 0 and 1. 0 = don't execute. 1 = all in.
    def should_execute(self, dt: date, price_series: pd.Series, history: StockHistory) -> Confidence:
        pass


class StockSimulator:

    def __init__(self,
                 symbols: Iterable[str],
                 entry_strategy: StockStrategy,
                 exit_strategy: StockStrategy):
        self._symbols = set(symbols)
        open_df, high_df, low_df, close_df, volume_df = stock_cache.get_prices(symbols)
        self._close_df = close_df
        self._entry_strategy = entry_strategy
        self._exit_strategy = exit_strategy

    def run(self,
            start_date: date = (date.today() - pd.DateOffset(years=5)).date(),
            end_date: date = date.today()) -> pd.Series:
        cash = 1
        curr_holdings: Dict[str, float] = defaultdict(float)
        history: Dict[str, StockHistory] = defaultdict(list)

        date_range = pd.date_range(start_date, end_date, freq="B")
        balance = pd.Series(index=date_range, name="balance")
        close_df = self._close_df[start_date: end_date]

        for dt in date_range:
            # check sell
            sold_symbols: Set[str] = set()
            if curr_holdings:
                for symbol, buy_shares in list(curr_holdings.items()):
                    confidence = self._exit_strategy.should_execute(dt, close_df.loc[:dt, symbol], history[symbol])
                    if confidence > 0:
                        price = close_df.loc[dt, symbol]
                        sell_shares = confidence * buy_shares
                        sell_amount = sell_shares * price

                        curr_holdings[symbol] -= sell_shares
                        if curr_holdings[symbol] == 0:
                            del curr_holdings[symbol]
                        cash += sell_amount
                        history[symbol].append(StockAction(StockSide.SELL, dt, sell_shares))

                        sold_symbols.add(symbol)

            # check buy
            can_buy_symbols = self._symbols.difference(sold_symbols)
            buy_confidences: Dict[str, Confidence] = dict()
            for symbol in can_buy_symbols:
                confidence = self._entry_strategy.should_execute(dt, close_df.loc[:dt, symbol], history[symbol])
                if confidence > 0:
                    buy_confidences[symbol] = confidence
            if len(buy_confidences):
                budget = cash / len(buy_confidences)
                for symbol, confidence in buy_confidences.items():
                    price = close_df.loc[dt, symbol]
                    buy_amount = confidence * budget
                    buy_shares = buy_amount / price

                    curr_holdings[symbol] += buy_shares
                    cash -= buy_amount
                    history[symbol].append(StockAction(StockSide.BUY, dt, buy_shares))

            # valuation
            valuation = cash
            for symbol, buy_shares in curr_holdings.items():
                price = close_df.loc[dt, symbol]
                valuation += buy_shares * price
            balance.at[dt] = valuation

        return balance
