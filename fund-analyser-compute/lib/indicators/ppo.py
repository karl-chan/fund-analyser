import numpy as np
import talib
from overrides import overrides

from lib.fund.fund import Fund, FundHistoricPrices, FundIndicator
from lib.indicators.indicator import Indicator


class PPO(Indicator):
    def get_key(self) -> str:
        return "ppo"

    def get_display_name(self) -> str:
        return "PPO"

    @overrides
    def calc(self, fund: Fund, historic_prices: FundHistoricPrices) -> FundIndicator:
        if historic_prices.empty:
            return FundIndicator(np.nan)
        else:
            ppo_series = talib.PPO(historic_prices)
            return FundIndicator(ppo_series.iloc[-1])
