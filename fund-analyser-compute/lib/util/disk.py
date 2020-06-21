import os
import pickle
import tempfile
from typing import Any

import humanize

from lib.util.logging_utils import log_debug


def write_to_disk(file_name: str, data: Any) -> None:
    with open(_get_tmp_file(file_name), "wb") as file:
        pickle.dump(data, file)
    log_debug(f"Wrote {_get_file_size(file_name)} from pickle file: {_get_tmp_file(file_name)}")


def read_from_disk(file_name: str) -> Any:
    with open(_get_tmp_file(file_name), "rb") as file:
        data = pickle.load(file)
    log_debug(f"Read {_get_file_size(file_name)} from pickle file: {_get_tmp_file(file_name)}")
    return data


def _get_tmp_file(file_name: str) -> str:
    return os.path.join(tempfile.gettempdir(), file_name)


def _get_file_size(file_name: str) -> str:
    return humanize.naturalsize(os.path.getsize(_get_tmp_file(file_name)))
