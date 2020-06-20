from datetime import datetime
from typing import Callable

import numpy as np
import pandas as pd
from overrides import overrides

from lib.fund.fund import FundHistoricPrices, FundIndicator
from lib.indicators.indicator import DisplayFormat, Indicator
from lib.util.dates import format_date
from lib.util.pandas_utils import drop_duplicate_index, pd_offset_from_lookback


def _reduce_returns(historic_prices_series: FundHistoricPrices, offset: pd.DateOffset,
                    agg_func: Callable[[FundHistoricPrices], datetime]) -> FundIndicator:
    try:
        shifted_series = drop_duplicate_index(
            historic_prices_series.shift(freq=offset)) \
            .reindex(index=historic_prices_series.index, method="ffill")
        returns_series = (historic_prices_series - shifted_series) / shifted_series
        date = agg_func(returns_series)
        return FundIndicator(returns_series[date], metadata={"date": format_date(date)})
    except:
        return FundIndicator(np.nan)


class MaxReturns(Indicator):
    def __init__(self, lookback: str):
        self._lookback = lookback
        self._offset = pd_offset_from_lookback(lookback)

    def get_key(self) -> str:
        return f"returns_{self._lookback}_max"

    def get_display_name(self) -> str:
        return f"Max {self._lookback}"

    @overrides
    def get_display_format(self) -> DisplayFormat:
        return DisplayFormat.PERCENT

    @overrides
    def calc(self, historic_prices: FundHistoricPrices) -> FundIndicator:
        return _reduce_returns(historic_prices, self._offset, lambda s: s.idxmax())


class MinReturns(Indicator):
    def __init__(self, lookback: str):
        self._lookback = lookback
        self._offset = pd_offset_from_lookback(lookback)

    def get_key(self) -> str:
        return f"returns_{self._lookback}_min"

    def get_display_name(self) -> str:
        return f"Min {self._lookback}"

    @overrides
    def get_display_format(self) -> DisplayFormat:
        return DisplayFormat.PERCENT

    @overrides
    def calc(self, historic_prices: FundHistoricPrices) -> FundIndicator:
        return _reduce_returns(historic_prices, self._offset, lambda s: s.idxmin())
