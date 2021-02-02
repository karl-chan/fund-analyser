from typing import Dict, Iterator, Optional

import requests
import ujson

from lib.util import properties

DATA_HOST = properties.get("client.data")


def _remove_leading_slash(endpoint: str) -> str:
    return endpoint[1:] if endpoint.startswith("/") else endpoint


def get(endpoint: str, params: Optional[Dict[str, str]] = None) -> object:
    endpoint = f"{DATA_HOST}/{_remove_leading_slash(endpoint)}"
    return requests.get(endpoint, params).json()


def post(endpoint: str, data: Optional[object] = None) -> object:
    endpoint = f"{DATA_HOST}/{_remove_leading_slash(endpoint)}"
    return requests.post(endpoint, json=data)


def stream(endpoint: str, data: Optional[object] = None) -> Iterator[Dict]:
    endpoint = f"{DATA_HOST}/{_remove_leading_slash(endpoint)}"
    line_seps = {b",", b"[", b"]"}
    lines = requests.post(endpoint, json=data, stream=True).iter_lines()
    return (ujson.loads(line)
            for line in lines
            if line not in line_seps)
