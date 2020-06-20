from abc import ABC, abstractmethod
from enum import Enum

from lib.fund.fund import FundHistoricPrices, FundIndicator


class DisplayFormat(Enum):
    DEFAULT = "default"
    PERCENT = "percent"


class Indicator(ABC):
    @abstractmethod
    def get_key(self) -> str:
        pass

    @abstractmethod
    def get_display_name(self) -> str:
        pass

    def get_display_format(self) -> DisplayFormat:
        return DisplayFormat.DEFAULT

    @abstractmethod
    def calc(self, historic_prices: FundHistoricPrices) -> FundIndicator:
        pass
