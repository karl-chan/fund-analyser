from __future__ import annotations

from datetime import datetime
from typing import Dict, NamedTuple, Optional

import pandas as pd
from overrides import overrides

from lib.util.dates import parse_date
from lib.util.maths import replace_nan

StockHistoricPrices = pd.DataFrame


class StockRealTimeDetails(NamedTuple):
    estChange: Optional[float] = None
    estPrice: Optional[float] = None
    bidAskSpread: Optional[float] = None
    longestTimeGap: Optional[float] = None
    lastUpdated: Optional[datetime] = None

    @classmethod
    def from_dict(cls, d: Dict) -> StockRealTimeDetails:
        temp = dict(d)
        temp["lastUpdated"] = parse_date(d["lastUpdated"]) if d.get("lastUpdated") else None
        return StockRealTimeDetails(**temp)


class StockIndicator(NamedTuple):
    value: float
    metadata: Optional[Dict[str, str]] = None

    @classmethod
    def from_dict(cls, d: Dict) -> StockIndicator:
        return StockIndicator(**d)

    def as_dict(self) -> Dict:
        return {
            "value": replace_nan(self.value),
            "metadata": self.metadata
        }


StockIndicators = Dict[str, StockIndicator]

class Stock(NamedTuple):
    symbol: str
    name: Optional[str] = None
    returns: Dict[str, float] = dict()
    asof: Optional[datetime] = None
    indicators: Optional[StockIndicators] = None
    realTimeDetails: Optional[StockRealTimeDetails] = None
    fundamentals: Dict[str, float] = dict()

    @classmethod
    def from_dict(cls, d: Dict) -> Stock:
        temp = dict(d)
        temp["asof"] = parse_date(d["asof"]) if d.get("asof") else None
        temp["indicators"] = {k: StockIndicator.from_dict(v) for k, v in d.get("indicators", dict()).items()}
        temp["realTimeDetails"] = StockRealTimeDetails.from_dict(d.get("realTimeDetails", dict()))
        temp.pop("historicPrices", [])
        return Stock(**temp)

    @overrides
    def __eq__(self, other: object) -> bool:
        res = True
        for k, v in self._asdict().items():
            res &= v == getattr(other, k)
        return res
