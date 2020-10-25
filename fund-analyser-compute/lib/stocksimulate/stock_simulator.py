from collections import defaultdict
from datetime import date
from typing import Dict, Iterable, Set, Tuple

import pandas as pd

from lib.stock import stock_cache
from lib.stocksimulate.stock_history import TradeHistory
from lib.stocksimulate.stock_trade import StockAction, StockSide
from lib.stocksimulate.strategy.stock_strategy import StockStrategy


class StockSimulator:

    def __init__(self,
                 symbols: Iterable[str],
                 entry_strategy: StockStrategy,
                 exit_strategy: StockStrategy):
        self._symbols = set(symbols)
        prices_df, open_df, high_df, low_df, close_df, volume_df = stock_cache.get_prices(symbols)
        self._prices_df = prices_df
        self._entry_strategy = entry_strategy
        self._exit_strategy = exit_strategy

    def run(self,
            start_date: date = (date.today() - pd.DateOffset(years=5)).date(),
            end_date: date = date.today()) -> Tuple[pd.DataFrame, TradeHistory]:
        cash = 100.0
        curr_holdings: Dict[str, float] = defaultdict(float)
        history: TradeHistory = defaultdict(list)

        date_range = pd.date_range(start_date, end_date, freq="B")
        account = pd.DataFrame(index=date_range, columns=["value", "holdings"])
        prices_df = self._prices_df[start_date: end_date]  # type:ignore

        for dt in date_range:
            # check sell
            sold_symbols: Set[str] = set()
            if curr_holdings:
                curr_symbols = curr_holdings.keys()
                confidences = self._exit_strategy.should_execute(dt, prices_df.loc[:dt, curr_symbols], history)
                for symbol, confidence in confidences.items():
                    bought_shares = curr_holdings[symbol]
                    if confidence > 0 and bought_shares > 0:
                        price = prices_df.loc[dt, symbol]
                        sell_shares = confidence * bought_shares
                        sell_amount = sell_shares * price

                        curr_holdings[symbol] -= sell_shares
                        if curr_holdings[symbol] == 0:
                            del curr_holdings[symbol]
                        cash += sell_amount
                        history[symbol].append(StockAction(StockSide.SELL, dt, sell_shares))

                        sold_symbols.add(symbol)

            # check buy
            can_buy_symbols = self._symbols.difference(sold_symbols)
            confidences = self._entry_strategy.should_execute(dt, prices_df.loc[:dt, can_buy_symbols], history)
            buy_confidences = {k: v for k, v in confidences.items() if v > 0}
            if len(buy_confidences) and cash > 0:
                budget = cash / len(buy_confidences)
                for symbol, confidence in buy_confidences.items():
                    price = prices_df.loc[dt, symbol]
                    buy_amount = confidence * budget
                    bought_shares = buy_amount / price

                    curr_holdings[symbol] += bought_shares
                    cash -= buy_amount
                    history[symbol].append(StockAction(StockSide.BUY, dt, bought_shares))

            # valuation
            valuation = cash
            for symbol, bought_shares in curr_holdings.items():
                price = prices_df.loc[dt, symbol]
                valuation += bought_shares * price
            account.at[dt] = [valuation, ','.join(curr_holdings.keys())]

        return account, history
