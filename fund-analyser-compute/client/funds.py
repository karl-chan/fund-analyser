from typing import List

from client import data
from lib.fund.fund import Fund


def get_funds(isins: List[str]) -> List[Fund]:
    return list(map(Fund.from_dict, data.get(f"/funds/isins/{','.join(isins)}")))
