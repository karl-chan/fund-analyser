from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import date
from typing import List

import pandas as pd
from overrides import overrides


class Strategy(ABC):
    from lib.simulate import simulator
    @abstractmethod
    def run(self, dt: date, prices_df: pd.DataFrame, fees_df: pd.DataFrame) -> List[str]:
        pass

    @abstractmethod
    def on_data_ready(self, data: simulator.Simulator.Data) -> None:
        pass


class SelectAll(Strategy):
    from lib.simulate import simulator
    @overrides
    def run(self, dt: date, prices_df: pd.DataFrame, fees_df: pd.DataFrame) -> List[str]:
        return list(prices_df.columns)

    @overrides
    def on_data_ready(self, data: simulator.Simulator.Data) -> None:
        pass
