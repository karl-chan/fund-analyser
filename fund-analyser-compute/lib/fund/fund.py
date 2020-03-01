from __future__ import annotations

from datetime import datetime
from typing import Dict, List, NamedTuple, Optional, Tuple

import pandas as pd
from overrides import overrides

from lib.util.dates import parse_date
from lib.util.enums import StrEnum
from lib.util.maths import replace_nan


class FundShareClass(StrEnum):
    INC = "Inc"
    ACC = "Acc"


class FundType(StrEnum):
    OEIC = "OEIC"
    UNIT = "UNIT"


class FundHolding(NamedTuple):
    name: str
    symbol: str
    weight: float

    @classmethod
    def from_dict(cls, d: Dict) -> FundHolding:
        return FundHolding(**d)


FundHistoricPrices = pd.Series


class FundRealTimeHolding(NamedTuple):
    name: str
    symbol: str
    weight: float
    currency: str
    todaysChange: float

    @classmethod
    def from_dict(cls, d: Dict) -> FundRealTimeHolding:
        return FundRealTimeHolding(**d)


class FundRealTimeDetails(NamedTuple):
    estChange: float = None
    estPrice: float = None
    stdev: float = None
    ci: Tuple[float, float] = None
    holdings: List[FundRealTimeHolding] = []
    lastUpdated: datetime = None

    @classmethod
    def from_dict(cls, d: Dict) -> FundRealTimeDetails:
        temp = dict(d)
        temp["ci"] = tuple(d.get("ci", [None, None]))
        temp["holdings"] = [FundRealTimeHolding.from_dict(h) for h in d.get("holdings", [])]
        temp["lastUpdated"] = parse_date(d["lastUpdated"]) if d.get("lastUpdated") else None
        return FundRealTimeDetails(**temp)


class FundIndicator(NamedTuple):
    value: float
    metadata: Optional[Dict[str, str]] = None

    @classmethod
    def from_dict(cls, d: Dict) -> FundIndicator:
        return FundIndicator(**d)

    def as_dict(self) -> Dict:
        return {
            "value": replace_nan(self.value),
            "metadata": self.metadata
        }


FundIndicators = Dict[str, FundIndicator]


class Fund(NamedTuple):
    isin: str
    sedol: str = None
    name: str = None
    type: FundType = None
    shareClass: FundShareClass = None
    frequency: str = None
    ocf: float = None
    amc: float = None
    entryCharge: float = None
    exitCharge: float = None
    bidAskSpread: float = None
    holdings: List[FundHolding] = []
    returns: Dict[str, float] = dict()
    asof: datetime = None
    indicators: FundIndicators = None
    realTimeDetails: FundRealTimeDetails = None

    @classmethod
    def from_dict(cls, d: Dict) -> Fund:
        temp = dict(d)
        temp["type"] = FundType.from_str(d.get("type"))
        temp["shareClass"] = FundShareClass.from_str(d.get("shareClass"))
        temp["holdings"] = [FundHolding.from_dict(e) for e in d.get("holdings", [])]
        temp["asof"] = parse_date(d["asof"]) if d.get("asof") else None
        temp["indicators"] = {k: FundIndicator.from_dict(v) for k, v in d.get("indicators", dict()).items()}
        temp["realTimeDetails"] = FundRealTimeDetails.from_dict(d.get("realTimeDetails", dict()))
        temp.pop("historicPrices", [])
        return Fund(**temp)

    @overrides
    def __eq__(self, other: Fund) -> bool:
        res = True
        for k, v in self._asdict().items():
            res &= v == getattr(other, k)
        return res
