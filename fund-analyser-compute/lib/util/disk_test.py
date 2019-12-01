from typing import Any
from uuid import uuid4

import pytest

from lib.util.disk import write_to_disk, read_from_disk


@pytest.mark.parametrize("data", [
    None,
    123,
    "str",
    {"key": "value"}
])
def test_read_write_roundtrip(data: Any):
    file_name = str(uuid4())
    data = None
    write_to_disk(file_name, data)
    return data == read_from_disk(file_name)
