from overrides import overrides

from lib.fund.fund import Fund, FundHistoricPrices, FundIndicator
from lib.indicators.indicator import Indicator
from lib.util.maths import format_float


class Stability(Indicator):
    def get_key(self) -> str:
        return "stability"

    def get_display_name(self) -> str:
        return "Stability"

    @overrides
    def calc(self, fund: Fund, historic_prices: FundHistoricPrices) -> FundIndicator:
        daily_returns = historic_prices.diff().iloc[1:]
        signs = daily_returns.clip(-1, 1).replace(0, method="ffill")
        labelled_consecutive_groups = (signs * signs.shift() < 0).cumsum()
        consecutive_days = labelled_consecutive_groups.groupby(labelled_consecutive_groups).count()
        return FundIndicator(consecutive_days.mean(),
                             metadata={
                                 "max": format_float(consecutive_days.max()),
                                 "min": format_float(consecutive_days.min()),
                                 "median": format_float(consecutive_days.median())
                             })
