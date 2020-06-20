from functools import lru_cache
from typing import List

from lib.fund.fund import Fund
from lib.indicators.indicator import Indicator
from lib.indicators.mdt import MDT
from lib.util import properties


@lru_cache(maxsize=1)
def get_all_indicators() -> List[Indicator]:
    from .ppo import PPO
    from .mdd import MDD
    from .sharpe_ratio import SharpeRatio
    from .stability import Stability
    from .returns import MaxReturns, MinReturns
    from .rsi import RSI
    lookbacks = properties.get("fund.lookbacks")
    return [MDD(), MDT(), PPO(), RSI(), SharpeRatio(), Stability()] \
           + [MaxReturns(lookback) for lookback in lookbacks] \
           + [MinReturns(lookback) for lookback in lookbacks]


def get_all_fund_indicators(fund: Fund) -> List[Indicator]:
    from .after_fees_return import AfterFeesReturn
    return get_all_indicators() + [AfterFeesReturn(fund)]


def get_all_stock_indicators() -> List[Indicator]:
    return get_all_indicators()
