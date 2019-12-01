from enum import Enum


class StrEnum(Enum):
    @classmethod
    def from_str(cls, name: str):
        return next((e for e in cls if e.value == name), None)
