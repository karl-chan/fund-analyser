from typing import List, Iterator

from client import data
from lib.fund.fund import Fund


def get_all_isins() -> List[str]:
    return list(data.get("/funds/isins"))


def get_funds(isins: List[str]) -> List[Fund]:
    return list(map(Fund.from_dict, data.get(f"/funds/isins/{','.join(isins)}")))


def stream_funds(isins: List[str] = ["all"]) -> Iterator[Fund]:
    params = {"stream": "true"}
    return map(Fund.from_dict, data.stream(f"/funds/isins/{','.join(isins)}", params))
