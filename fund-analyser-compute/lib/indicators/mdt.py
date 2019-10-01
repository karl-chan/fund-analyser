import numpy as np
from overrides import overrides
from pandas import DatetimeIndex

from lib.fund.fund import FundIndicator, FundHistoricPrices
from lib.indicators.indicator import Indicator, DisplayFormat
from lib.util.date import format_date


# Max downtime
class MDT(Indicator):
    def get_key(self) -> str:
        return "mdt"

    def get_display_name(self) -> str:
        return "MDT"

    @overrides
    def get_display_format(self) -> DisplayFormat:
        return DisplayFormat.DEFAULT

    @overrides
    def calc(self, historic_prices: FundHistoricPrices) -> FundIndicator:
        try:
            peaks = historic_prices.expanding().max()
            peak_diffs = peaks.diff()
            recovery_dates = peak_diffs.index[peak_diffs.gt(0)]
            # add begin and last before comparison
            recovery_dates = recovery_dates \
                .insert(0, historic_prices.first_valid_index()) \
                .append(DatetimeIndex([historic_prices.last_valid_index()]))
            recovery_times = recovery_dates.to_series().diff()
            date, mdt = recovery_times.idxmax(), recovery_times.max().days
            return FundIndicator(mdt, metadata={"date": format_date(date)})
        except:
            return FundIndicator(np.nan)
