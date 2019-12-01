import os
import pickle
import tempfile
from typing import Any


def write_to_disk(file_name: str, data: Any) -> None:
    with open(_get_tmp_file(file_name), "wb") as file:
        pickle.dump(data, file)


def read_from_disk(file_name: str) -> Any:
    with open(_get_tmp_file(file_name), "rb") as file:
        data = pickle.load(file)
    return data


def _get_tmp_file(file_name: str) -> str:
    return os.path.join(tempfile.gettempdir(), file_name)
