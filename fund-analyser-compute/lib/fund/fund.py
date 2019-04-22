from __future__ import annotations

from datetime import datetime
from typing import Dict, List, NamedTuple, Optional, Tuple

import pandas as pd
from overrides import overrides

from lib.util.date import parse_date
from lib.util.enum import StrEnum
from lib.util.math import replace_nan


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
    estChange: float
    estPrice: float
    stdev: float
    ci: Tuple[float, float]
    holdings: List[FundRealTimeHolding]
    lastUpdated: datetime

    @classmethod
    def from_dict(cls, d: Dict) -> FundRealTimeDetails:
        temp = dict(d)
        temp["ci"] = tuple(d["ci"])
        temp["holdings"] = [FundRealTimeHolding.from_dict(h) for h in d["holdings"]]
        temp["lastUpdated"] = parse_date(d["lastUpdated"])
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
    sedol: str
    name: str
    type: FundType
    shareClass: FundShareClass
    frequency: str
    ocf: float
    amc: float
    entryCharge: float
    exitCharge: float
    bidAskSpread: float
    holdings: List[FundHolding]
    historicPrices: FundHistoricPrices
    returns: Dict[str, float]
    asof: datetime
    indicators: FundIndicators
    realTimeDetails: FundRealTimeDetails

    @classmethod
    def from_dict(cls, d: Dict) -> Fund:
        from lib.util.pandas import pd_historic_prices_from_json
        temp = dict(d)
        temp["type"] = FundType.from_str(d.get("type", None))
        temp["shareClass"] = FundShareClass.from_str(d.get("shareClass", None))
        temp["holdings"] = [FundHolding.from_dict(e) for e in d["holdings"]]
        temp["historicPrices"] = pd_historic_prices_from_json(d["historicPrices"])
        temp["asof"] = parse_date(d["asof"])
        temp["indicators"] = {k: FundIndicator.from_dict(v) for k, v in d["indicators"].items()}
        temp["realTimeDetails"] = FundRealTimeDetails.from_dict(d["realTimeDetails"])
        return Fund(**temp)

    @overrides
    def __eq__(self, other: Fund) -> bool:
        res = True
        for k, v in self._asdict().items():
            if k == "historicPrices":
                res &= v.equals(other.historicPrices)
            else:
                res &= v == getattr(other, k)
        return res
