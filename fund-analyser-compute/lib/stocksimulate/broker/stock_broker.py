from abc import ABC, abstractmethod
from typing import List

from overrides import overrides

from lib.stocksimulate.stock_trade import StockAction


class StockBroker(ABC):
    @abstractmethod
    def fractional_shares(self) -> bool:
        pass

    @abstractmethod
    def calc_fees(self, stock_actions: List[StockAction]) -> float:
        pass


class CharlesSchwab(StockBroker):
    @overrides
    def fractional_shares(self) -> bool:
        return False

    @overrides
    def calc_fees(self, stock_actions: List[StockAction]) -> float:
        return 0


class Trading212(StockBroker):
    @overrides
    def fractional_shares(self) -> bool:
        return True

    @overrides
    def calc_fees(self, stock_actions: List[StockAction]) -> float:
        return 0


class IBKRPro(StockBroker):

    def __init__(self):
        self._fee_per_share = 0.005
        self._min_per_order = 1.0
        self._max_pct_trade_value = 0.01

    @overrides
    def fractional_shares(self) -> bool:
        return True

    @overrides
    def calc_fees(self, stock_actions: List[StockAction]) -> float:
        total = 0.0
        trade_value = 0.0
        for action in stock_actions:
            total += self._fee_per_share * action.shares
            trade_value += action.shares * action.price

        fees_lower_bound = self._min_per_order  # Assuming ComboOrder
        fees_upper_bound = self._max_pct_trade_value * trade_value
        return min(fees_upper_bound, max(fees_lower_bound, total))
