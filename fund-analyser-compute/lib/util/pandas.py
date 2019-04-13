import re
from typing import Optional, Dict, List

import pandas as pd

from lib.fund.fund import FundHistoricPrices


def pd_historic_prices_from_json(historic_prices_json: List[Dict]) -> FundHistoricPrices:
    if not len(historic_prices_json):
        return pd.Series()
    historic_prices = pd.DataFrame.from_records(historic_prices_json, index="date").squeeze(axis=1)
    historic_prices.index = pd.to_datetime(historic_prices.index)
    return historic_prices


def pd_offset_from_lookback(lookback: str) -> Optional[pd.DateOffset]:
    match = re.search(r"^(\d+)([DWMY])", lookback)
    if not match:
        return None
    else:
        n = int(match.group(1))
        unit = match.group(2)
        if unit == "D":
            return pd.DateOffset(days=n)
        if unit == "W":
            return pd.DateOffset(weeks=n)
        if unit == "M":
            return pd.DateOffset(months=n)
        if unit == "Y":
            return pd.DateOffset(years=n)


def drop_duplicate_index(df: pd.DataFrame) -> pd.DataFrame:
    return df[~df.index.duplicated()]
