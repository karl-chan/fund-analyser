import numpy as np
from overrides import overrides

from lib.fund.fund import FundHistoricPrices, FundIndicator
from lib.fund.fund_utils import calc_sharpe_ratio
from lib.indicators.indicator import Indicator


class SharpeRatio(Indicator):
    def get_key(self) -> str:
        return "sharpe_ratio"

    def get_display_name(self) -> str:
        return "Sharpe Ratio"

    @overrides
    def calc(self, historic_prices: FundHistoricPrices) -> FundIndicator:
        if historic_prices.empty:
            return FundIndicator(np.nan)
        else:
            sharpe_ratio = calc_sharpe_ratio(historic_prices)
            return FundIndicator(sharpe_ratio)
