from abc import ABC, abstractmethod
from datetime import date
from typing import Dict

import pandas as pd

from lib.stocksimulate.stock_history import TradeHistory

Confidence = float

Confidences = Dict[str, Confidence]


class StockStrategy(ABC):
    @abstractmethod
    # return range between 0 and 1. 0 = don't execute. 1 = all in.
    def should_execute(self, dt: date, prices_df: pd.DataFrame, history: TradeHistory) -> Confidences:
        pass
