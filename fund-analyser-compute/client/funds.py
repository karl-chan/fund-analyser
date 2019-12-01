from typing import Iterator, NamedTuple, Optional, Iterable

from client import data
from lib.fund.fund import Fund, FundHistoricPrices
from lib.util.pandas import pd_historic_prices_from_json


class FundStreamEntry(NamedTuple):
    fund: Fund
    historic_prices: FundHistoricPrices


def stream_funds(isins: Optional[Iterable[str]] = None) -> Iterator[FundStreamEntry]:
    params = {"stream": "true"}
    return map(
        lambda d: FundStreamEntry(
            fund=Fund.from_dict(d),
            historic_prices=pd_historic_prices_from_json(d["historicPrices"]).rename(d["isin"])
        ),
        data.stream(f"/funds/isins/{','.join(isins) if isins is not None else 'all'}", params))
