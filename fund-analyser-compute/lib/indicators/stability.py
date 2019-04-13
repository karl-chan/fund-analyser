from overrides import overrides

from lib.fund.fund import FundHistoricPrices, FundIndicator
from lib.indicators.indicator import Indicator


class Stability(Indicator):
    def get_key(self) -> str:
        return "stability"

    def get_display_name(self) -> str:
        return "Stability"

    @overrides
    def calc(self, historic_prices: FundHistoricPrices) -> FundIndicator:
        daily_returns = historic_prices.diff().iloc[1:]
        signs = daily_returns.clip(-1, 1).replace(0, method="ffill")
        labelled_consecutive_groups = (signs * signs.shift() < 0).cumsum()
        consecutive_days = labelled_consecutive_groups.groupby(labelled_consecutive_groups).count()
        return FundIndicator(consecutive_days.mean(),
                             metadata={
                                 "max": f"{consecutive_days.max():.2f}",
                                 "min": f"{consecutive_days.min():.2f}",
                                 "median": f"{consecutive_days.median():.2f}"
                             })
