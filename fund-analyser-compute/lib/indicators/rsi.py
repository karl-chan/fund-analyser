import numpy as np
import talib
from overrides import overrides

from lib.fund.fund import FundHistoricPrices, FundIndicator
from lib.indicators.indicator import Indicator


class RSI(Indicator):
    def get_key(self) -> str:
        return "rsi"

    def get_display_name(self) -> str:
        return "RSI"

    @overrides
    def calc(self, historic_prices: FundHistoricPrices) -> FundIndicator:
        if historic_prices.empty:
            return FundIndicator(np.nan)
        else:
            rsi_series = talib.RSI(historic_prices)
            return FundIndicator(rsi_series.iloc[-1])
