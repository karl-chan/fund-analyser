from typing import Iterable, Iterator, NamedTuple, Optional

from client import data
from lib.stock.stock import Stock, StockHistoricPrices
from lib.util.logging_utils import log_error
from lib.util.pandas_utils import pd_historic_prices_from_json


class StockStreamEntry(NamedTuple):
    stock: Stock
    historic_prices: StockHistoricPrices


def stream_stocks(symbols: Optional[Iterable[str]] = None) -> Iterator[StockStreamEntry]:
    for d in data.stream("/stocks/stream", data={"symbols": symbols}):
        try:
            yield StockStreamEntry(
                stock=Stock.from_dict(d),
                historic_prices=pd_historic_prices_from_json(d.get("historicPrices", []))
            )
        except Exception as e:
            log_error(f"Failed to convert {d} to stock! Cause: {repr(e)}")
