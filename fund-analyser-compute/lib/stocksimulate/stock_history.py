from datetime import date
from typing import Dict, List, Optional

from lib.stocksimulate.stock_trade import StockAction, StockSide

TradeHistory = Dict[str, List[StockAction]]


def last_bought_date(symbol: str, history: TradeHistory) -> Optional[date]:
    return next((stock_action.dt
                 for stock_action in reversed(history[symbol])
                 if stock_action.side == StockSide.BUY),
                None)
