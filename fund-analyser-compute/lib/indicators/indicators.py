from functools import lru_cache
from typing import List

from lib.indicators.indicator import Indicator
from lib.indicators.mdt import MDT
from lib.util import properties


@lru_cache(maxsize=1)
def get_all_indicators() -> List[Indicator]:
    from .after_fees_return import AfterFeesReturn
    from .ppo import PPO
    from .mdd import MDD
    from .sharpe_ratio import SharpeRatio
    from .stability import Stability
    from .returns import MaxReturns, MinReturns
    from .rsi import RSI
    lookbacks = properties.get("fund.lookbacks")
    return [MDD(), MDT(), PPO(), RSI(), SharpeRatio(), Stability(), AfterFeesReturn()] \
           + [MaxReturns(lookback) for lookback in lookbacks] \
           + [MinReturns(lookback) for lookback in lookbacks]
