import numpy as np
from overrides import overrides
from ta.trend import macd_diff, macd_signal, macd

from lib.fund.fund import FundHistoricPrices, FundIndicator
from lib.indicators.indicator import Indicator


class MACD(Indicator):
    def get_key(self) -> str:
        return "macd"

    def get_display_name(self) -> str:
        return "MACD"

    @overrides
    def calc(self, historic_prices: FundHistoricPrices) -> FundIndicator:
        macd_series = macd(historic_prices)
        macd_signal_series = macd_signal(historic_prices)
        macd_diff_series = macd_diff(historic_prices)
        if macd_series.empty:
            return FundIndicator(np.nan)
        else:
            return FundIndicator(macd_diff_series.iloc[-1],
                                 metadata={
                                     "macd": macd_series.iloc[-1],
                                     "macd_signal": macd_signal_series.iloc[-1]
                                 })
