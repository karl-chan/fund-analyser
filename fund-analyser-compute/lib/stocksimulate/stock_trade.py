from datetime import date
from enum import Enum
from typing import NamedTuple


class StockSide(Enum):
    BUY = "buy"
    SELL = "sell"


class StockAction(NamedTuple):
    side: StockSide
    dt: date
    shares: float
    price: float
