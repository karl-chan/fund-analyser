from typing import Dict, Optional

import requests

from lib.util import properties
from lib.util.env import is_production

DATA_HOST = properties.get("client.data.prod") if is_production() \
    else properties.get("client.data.dev")


def _remove_leading_slash(endpoint: str) -> str:
    return endpoint[1:] if endpoint.startswith("/") else endpoint


def get(endpoint: str, params: Optional[Dict[str, str]] = None):
    endpoint = f"{DATA_HOST}/api/{_remove_leading_slash(endpoint)}"
    return requests.get(endpoint, params).json()
