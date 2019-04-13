import numpy as np
from overrides import overrides
from ta.trend import macd_diff

from lib.fund.fund import FundHistoricPrices, FundIndicator
from lib.indicators.indicator import Indicator


class MACD(Indicator):
    def get_key(self) -> str:
        return "macd"

    def get_display_name(self) -> str:
        return "MACD"

    @overrides
    def calc(self, historic_prices: FundHistoricPrices) -> FundIndicator:
        macd_series = macd_diff(historic_prices)
        if macd_series.empty:
            return FundIndicator(np.nan)
        else:
            return FundIndicator(macd_series.iloc[-1])
