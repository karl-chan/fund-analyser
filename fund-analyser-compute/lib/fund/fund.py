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
    estChange: Optional[float] = None
    estPrice: Optional[float] = None
    stdev: Optional[float] = None
    ci: Optional[Tuple[float, float]] = None
    holdings: List[FundRealTimeHolding] = []
    lastUpdated: Optional[datetime] = None

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
    sedol: Optional[str] = None
    name: Optional[str] = None
    type: Optional[FundType] = None
    shareClass: Optional[FundShareClass] = None
    frequency: Optional[str] = None
    ocf: Optional[float] = None
    amc: Optional[float] = None
    entryCharge: Optional[float] = None
    exitCharge: Optional[float] = None
    bidAskSpread: Optional[float] = None
    holdings: List[FundHolding] = []
    returns: Dict[str, float] = dict()
    asof: Optional[datetime] = None
    indicators: Optional[FundIndicators] = None
    realTimeDetails: Optional[FundRealTimeDetails] = None

    @classmethod
    def from_dict(cls, d: Dict) -> Fund:
        temp = dict(d)
        temp["type"] = FundType.from_str(d.get("type"))  # type: ignore
        temp["shareClass"] = FundShareClass.from_str(d.get("shareClass"))  # type: ignore
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
