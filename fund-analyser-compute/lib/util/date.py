from datetime import datetime, date
from typing import Union

import ciso8601
import pandas as pd

BDAY = pd.tseries.offsets.BusinessDay(n=1)


def parse_date(s: str) -> datetime:
    return ciso8601.parse_datetime(s)


def format_date(d: Union[date, datetime]) -> str:
    return d.isoformat().replace("+00:00", "Z")
