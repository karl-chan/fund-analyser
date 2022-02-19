from overrides import overrides

from lib.fund.fund import FundHistoricPrices, FundIndicator
from lib.indicators.indicator import DisplayFormat, Indicator


class NumBreakouts(Indicator):
    def get_key(self) -> str:
        return "num_breakouts"

    def get_display_name(self) -> str:
        return "Num Breakouts"

    @overrides
    def get_display_format(self) -> DisplayFormat:
        return DisplayFormat.DEFAULT

    @overrides
    def calc(self, historic_prices: FundHistoricPrices) -> FundIndicator:
        return FundIndicator(
            float((historic_prices - historic_prices.shift().cummax()).gt(0).sum())
        )
