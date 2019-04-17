from functools import lru_cache
from typing import List

from lib.indicators.indicator import Indicator
from lib.util import properties


@lru_cache(maxsize=1)
def get_all_indicators() -> List[Indicator]:
    from .macd import MACD
    from .mdd import MDD
    from .stability import Stability
    from .returns import MaxReturns, MinReturns
    from .rsi import RSI
    lookbacks = properties.get("fund.lookbacks")
    return [Stability(), MACD(), RSI(), MDD()] \
           + [MaxReturns(lookback) for lookback in lookbacks] \
           + [MinReturns(lookback) for lookback in lookbacks]
