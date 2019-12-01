from functools import lru_cache
from typing import Dict, Optional

from lib.simulate.strategy.strategy import Strategy


@lru_cache(maxsize=1)
def get_all_strategies() -> Dict[str, Strategy]:
    from .adx_returns import AdxReturns
    from .bollinger_returns import BollingerReturns
    from .fibonacci_returns import FibonacciReturns
    from .macd_returns import MacdReturns
    from .momentum_returns import MomentumReturns
    from .price_channel_returns import PriceChannelReturns
    from .target_returns import TargetReturns
    all_strategies = [
        AdxReturns(),
        BollingerReturns(),
        FibonacciReturns(),
        MacdReturns(),
        MomentumReturns(),
        PriceChannelReturns(),
        TargetReturns(),
    ]
    return {strategy.__class__.__name__: strategy for strategy in all_strategies}


def from_name(s: str) -> Optional[Strategy]:
    return get_all_strategies().get(s)
