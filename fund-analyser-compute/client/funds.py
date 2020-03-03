import logging
from typing import Dict, Iterable, Iterator, List, NamedTuple, Optional

from client import data
from lib.fund.fund import Fund, FundHistoricPrices
from lib.util.pandas import pd_historic_prices_from_json

_LOG = logging.getLogger(__name__)


class FundStreamEntry(NamedTuple):
    fund: Fund
    historic_prices: FundHistoricPrices


class SimilarFundsEntry(NamedTuple):
    isin: str
    similar_isins: List[str]
    after_fees_return: Optional[float]

    def as_dict(self) -> Dict:
        return {
            "isin": self.isin,
            "similarIsins": self.similar_isins,
            "afterFeesReturn": self.after_fees_return
        }


SimilarFunds = List[SimilarFundsEntry]


def stream_funds(isins: Optional[Iterable[str]] = None) -> Iterator[FundStreamEntry]:
    params = {"stream": "true"}
    for d in data.stream(f"/funds/isins/{','.join(isins) if isins is not None else 'all'}", params):
        try:
            yield FundStreamEntry(
                fund=Fund.from_dict(d),
                historic_prices=pd_historic_prices_from_json(d["historicPrices"]).rename(d["isin"])
            )
        except Exception as e:
            _LOG.error(f"Failed to convert {d} to fund! Cause: {repr(e)}")


def post_similar_funds(similar_funds: SimilarFunds):
    data.post("/funds/similar-funds", {
        "similarFunds": [similar_funds_entry.as_dict() for similar_funds_entry in similar_funds]
    })
