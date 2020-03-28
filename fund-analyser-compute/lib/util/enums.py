from __future__ import annotations

from enum import Enum
from typing import Optional


class StrEnum(Enum):
    @classmethod
    def from_str(cls, name: str) -> Optional[StrEnum]:
        return next((e for e in cls if e.value == name), None)
