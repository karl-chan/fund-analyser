import numpy as np
from overrides import overrides

from lib.fund.fund import Fund, FundHistoricPrices, FundIndicator
from lib.fund.fund_utils import calc_fees
from lib.indicators.indicator import DisplayFormat, Indicator


class AfterFeesReturn(Indicator):
    def get_key(self) -> str:
        return "after_fees_return"

    def get_display_name(self) -> str:
        return "After Fees Return"

    def __init__(self, fund: Fund):
        self._fund = fund

    @overrides
    def get_display_format(self) -> DisplayFormat:
        return DisplayFormat.PERCENT

    @overrides
    def calc(self, historic_prices: FundHistoricPrices) -> FundIndicator:
        isin = self._fund.isin
        fees_df = calc_fees([self._fund])
        fees_per_year = fees_df.at[isin, "total_one_off_fees"] + fees_df.at[isin, "total_annual_fees"]
        returns_per_year = self._fund.returns.get("1Y") or np.nan
        after_fees_return = returns_per_year - fees_per_year
        return FundIndicator(after_fees_return)
