from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import date
from typing import List

import pandas as pd

from lib.simulate import simulator


class TieBreaker(ABC):
    @abstractmethod
    def run(self,
            allowed_isins: List[str],
            num_portfolio: int,
            dt: date,
            prices_df: pd.DataFrame,
            fees_df: pd.DataFrame) -> List[str]:
        pass

    @abstractmethod
    def on_data_ready(self, data: simulator.Simulator.Data) -> None:
        pass
