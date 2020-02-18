import logging
from typing import Iterable, Iterator, NamedTuple, Optional

from client import data
from lib.fund.fund import Fund, FundHistoricPrices
from lib.util.pandas import pd_historic_prices_from_json

_LOG = logging.getLogger(__name__)


class FundStreamEntry(NamedTuple):
    fund: Fund
    historic_prices: FundHistoricPrices


def stream_funds(isins: Optional[Iterable[str]] = None) -> Iterator[FundStreamEntry]:
    params = {"stream": "true"}
    for d in data.stream(f"/funds/isins/{','.join(isins) if isins is not None else 'all'}", params):
        try:
            yield FundStreamEntry(
                fund=Fund.from_dict(d),
                historic_prices=pd_historic_prices_from_json(d["historicPrices"]).rename(d["isin"])
            )
        except Exception as e:
            _LOG.error(f"Failed to convert {d} to fund! Cause: {e}")
