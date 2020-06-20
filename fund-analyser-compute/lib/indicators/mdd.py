import numpy as np
from ffn.core import to_drawdown_series
from overrides import overrides

from lib.fund.fund import FundHistoricPrices, FundIndicator
from lib.indicators.indicator import DisplayFormat, Indicator
from lib.util.dates import format_date


class MDD(Indicator):
    def get_key(self) -> str:
        return "mdd"

    def get_display_name(self) -> str:
        return "MDD"

    @overrides
    def get_display_format(self) -> DisplayFormat:
        return DisplayFormat.PERCENT

    @overrides
    def calc(self, historic_prices: FundHistoricPrices) -> FundIndicator:
        try:
            drawdown_series = to_drawdown_series(historic_prices)
            date = drawdown_series.idxmin()
            return FundIndicator(drawdown_series[date], metadata={"date": format_date(date)})
        except:
            return FundIndicator(np.nan)
