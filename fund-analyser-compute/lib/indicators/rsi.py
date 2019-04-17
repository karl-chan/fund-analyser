import numpy as np
from overrides import overrides
from ta.momentum import rsi

from lib.fund.fund import FundHistoricPrices, FundIndicator
from lib.indicators.indicator import Indicator


class RSI(Indicator):
    def get_key(self) -> str:
        return "rsi"

    def get_display_name(self) -> str:
        return "RSI"

    @overrides
    def calc(self, historic_prices: FundHistoricPrices) -> FundIndicator:
        rsi_series = rsi(historic_prices)
        if rsi_series.empty:
            return FundIndicator(np.nan)
        else:
            return FundIndicator(rsi_series.iloc[-1])
