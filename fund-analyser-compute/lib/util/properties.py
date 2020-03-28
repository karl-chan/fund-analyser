import configparser
import os
from typing import Any, Optional

import ujson

from lib.util import PROPERTIES_FILE

# magic string reminder to override property via environmental variables
OVERRIDE_ME = "override_me"

_config = configparser.ConfigParser()


def get(path: str) -> Any:
    return _try_parse(
        path,
        _get_from_environment(path)
        if path in os.environ
        else _get_from_file(path)
    )


def _get_from_environment(path: str) -> str:
    return os.environ[path]


def _get_from_file(path: str) -> Optional[str]:
    res = PROPERTIES_FILE
    for p in path.split(".", 1):
        if p not in res:
            return None
        res = res[p]
    return res if isinstance(res, str) else None


def _try_parse(path: str, value: Optional[str]) -> object:
    if value is None:
        return None
    try:
        value = ujson.loads(value)
    except ValueError:
        pass

    if value == OVERRIDE_ME:
        raise ValueError(f"Please override property {path} in system env variables!")

    return value
