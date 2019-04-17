from typing import List

from client import data
from lib.fund.fund import Fund


def get_funds(isins: List[str]) -> List[Fund]:
    return list(map(Fund.from_dict, data.get(f"/funds/isins/{','.join(isins)}")))


def get_all_isins() -> List[str]:
    return list(data.get("/funds/isins"))
