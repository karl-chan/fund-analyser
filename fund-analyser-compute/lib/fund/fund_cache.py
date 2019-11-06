import logging
import os
import pickle
import tempfile
from datetime import timedelta, datetime, date
from threading import Lock
from typing import Iterable, Set, Dict, Optional

import numpy as np

from client.funds import stream_funds
from lib.fund.fund import Fund

EXPIRY = timedelta(days=1)
_FILE_TMP_CACHE = os.path.join(tempfile.gettempdir(), "fund_cache.pickle")
_LOG = logging.getLogger(__name__)

_fund_cache: Dict[str, Fund] = dict()
_expiration_time: Optional[datetime] = None
_lock = Lock()


def refresh():
    global _fund_cache, _expiration_time
    _LOG.info("Refreshing fund cache...")
    _fund_cache = dict()
    counter = 0
    for fund in stream_funds():
        counter += 1
        _LOG.debug(f"Fund {counter} {fund.isin} received.")
        _fund_cache[fund.isin] = fund
    _expiration_time = datetime.now() + EXPIRY
    save_to_file()
    _LOG.info("Fund cache refreshed.")


def get(isins: Iterable[str] = None, apply_filter=True):
    if not valid():
        _lock.acquire()
        load_from_file_or_refresh() if not _expiration_time else refresh()
        _lock.release()

    if isins is None:
        isin_set = _fund_cache.keys()
    else:
        isin_set = set(isins)

    if apply_filter:
        isin_set = filter_isins(isin_set)

    return [_fund_cache[isin] for isin in isin_set]


def filter_isins(isins_set: Set[str]) -> Set[str]:
    def no_entry_charge(isin: str) -> bool:
        return not _fund_cache[isin].entryCharge

    def no_bid_ask_spread(isin: str) -> bool:
        return not _fund_cache[isin].bidAskSpread

    def daily_frequency(isin: str) -> bool:
        return _fund_cache[isin].frequency == "Daily"

    def long_history(isin: str) -> bool:
        return len(_fund_cache[isin].historicPrices) >= 30

    TODAY = date.today()

    def up_to_date(isin: str) -> bool:
        return np.busday_count(_fund_cache[isin].historicPrices.last_valid_index().date(), TODAY) <= 5

    funcs = [no_entry_charge, no_bid_ask_spread, daily_frequency, long_history, up_to_date]
    result = isins_set

    for func in funcs:
        result = filter(func, result)
    return result


def valid():
    return _expiration_time and datetime.now() <= _expiration_time


def load_from_file_or_refresh():
    try:
        load_from_file()
        _LOG.debug("Successfully loaded from pickle file.")
    except (ValueError, FileNotFoundError) as e:
        _LOG.warning(e)
        refresh()


def load_from_file():
    global _fund_cache, _expiration_time
    with open(_FILE_TMP_CACHE, "rb") as file:
        data = pickle.load(file)
    if datetime.now() > data["expiry"]:
        raise ValueError(f"Fund cache expired at: {data['expiry']}")
    _fund_cache, _expiration_time = data["funds"], data["expiry"]


def save_to_file():
    global _fund_cache
    with open(_FILE_TMP_CACHE, "wb") as file:
        data = {
            "expiry": _expiration_time,
            "funds": _fund_cache
        }
        pickle.dump(data, file)
