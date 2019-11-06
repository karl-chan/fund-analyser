from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import date
from typing import List

import pandas as pd
from overrides import overrides

from lib.simulate import simulator


class Strategy(ABC):
    @abstractmethod
    def run(self, dt: date, prices_df: pd.DataFrame, fees_df: pd.DataFrame) -> List[str]:
        pass

    @abstractmethod
    def on_data_ready(self, data: simulator.Simulator.Data) -> None:
        pass


class SelectAll(Strategy):
    @overrides
    def run(self, dt: date, prices_df: pd.DataFrame, fees_df: pd.DataFrame) -> List[str]:
        return list(prices_df.columns)

    @overrides
    def on_data_ready(self, data: simulator.Simulator.Data) -> None:
        pass
