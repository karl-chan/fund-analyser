from datetime import datetime

import ciso8601


def parse_date(s: str) -> datetime:
    return ciso8601.parse_datetime(s)


def format_date(d: datetime) -> str:
    return d.isoformat().replace("+00:00", "Z")
