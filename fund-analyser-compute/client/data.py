from typing import Dict, Optional

import requests
import ujson

from lib.util import properties

DATA_HOST = properties.get("client.data")


def _remove_leading_slash(endpoint: str) -> str:
    return endpoint[1:] if endpoint.startswith("/") else endpoint


def get(endpoint: str, params: Optional[Dict[str, str]] = None):
    endpoint = f"{DATA_HOST}/{_remove_leading_slash(endpoint)}"
    return requests.get(endpoint, params).json()


def stream(endpoint: str, params: Optional[Dict[str, str]] = None):
    endpoint = f"{DATA_HOST}/{_remove_leading_slash(endpoint)}"
    line_seps = {b",", b"[", b"]"}
    lines = requests.get(endpoint, params, stream=True).iter_lines()
    return (ujson.loads(line)
            for line in lines
            if line not in line_seps)
