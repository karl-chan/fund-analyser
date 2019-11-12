import logging
import os
import pickle
import tempfile
from datetime import timedelta, datetime, date
from threading import Lock
from typing import Iterable, Set, Dict, Optional, List

import numpy as np
import pandas as pd

from client.funds import stream_funds
from lib.fund.fund import Fund
from lib.fund.fund_utils import merge_funds_historic_prices

EXPIRY = timedelta(days=1)
_FILE_TMP_CACHE = os.path.join(tempfile.gettempdir(), "fund_cache.pickle")
_LOG = logging.getLogger(__name__)

_fund_cache: Dict[str, Fund] = dict()
_prices_df: Optional[pd.DataFrame] = None  # fast DataFrame cache for fund historicPrices
_expiration_time: Optional[datetime] = None
_lock = Lock()


def get(isins: Optional[Iterable[str]] = None, apply_filter: bool = True) -> List[Fund]:
    """
    Returns funds corresponding to isins.
    :param isins: iterable of isins
    :param apply_filter: Filters out desirable (tradable) isins
    :return: list of funds
    """
    maybe_initialise()
    isins = _normalise_isins(isins, apply_filter)
    return [_fund_cache[isin] for isin in isins]


def get_prices(isins: Iterable[str] = None, apply_filter=True) -> pd.DataFrame:
    maybe_initialise()
    isins = _normalise_isins(isins, apply_filter)
    return _prices_df[isins]


def filter_isins(isins: Iterable[str]) -> Set[str]:
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
    result = set(isins)

    for func in funcs:
        result = filter(func, result)
    return result


def valid() -> bool:
    """
    Returns whether fund cache is initialised and not expired.
    """
    return _expiration_time and datetime.now() <= _expiration_time


def initialise() -> None:
    """
    Initialises fund cache from file or web where appropriate.
    Applies locking to ensure no redundant initialisation is performed.
    """
    _lock.acquire()
    load_from_file_or_refresh()
    _lock.release()
    _LOG.info("Fund cache initialised.")


def maybe_initialise() -> None:
    if not valid():
        initialise()


def load_from_file_or_refresh() -> None:
    """
    Loads fund cache from file if present and not expired, else refresh from web.
    """
    try:
        load_from_file()
        _LOG.debug("Successfully loaded from pickle file.")
    except (ValueError, FileNotFoundError) as e:
        _LOG.warning(e)
        refresh()


def load_from_file() -> None:
    """
    Loads fund cache from file if present and not expired, else raises ValueError.
    """
    global _fund_cache, _prices_df, _expiration_time
    with open(_FILE_TMP_CACHE, "rb") as file:
        data = pickle.load(file)
    if datetime.now() > data["expiry"]:
        raise ValueError(f"Fund cache expired at: {data['expiry']}")
    _fund_cache, _prices_df, _expiration_time = data["funds"], data["prices_df"], data["expiry"]


def save_to_file() -> None:
    """
    Saves in-memory fund cache to file.
    :return:
    """
    global _fund_cache, _prices_df
    with open(_FILE_TMP_CACHE, "wb") as file:
        data = {
            "funds": _fund_cache,
            "prices_df": _prices_df,
            "expiry": _expiration_time
        }
        pickle.dump(data, file)


def refresh() -> None:
    """
    Builds a fresh copy of fund cache from web.
    """
    global _fund_cache, _prices_df, _expiration_time
    _LOG.info("Refreshing fund cache...")
    _fund_cache = dict()
    counter = 0
    for fund in stream_funds():
        counter += 1
        _LOG.debug(f"Fund {counter} {fund.isin} received.")
        _fund_cache[fund.isin] = fund
    _LOG.debug("Merging fund historic prices...")
    _prices_df = merge_funds_historic_prices(_fund_cache.values())
    _expiration_time = datetime.now() + EXPIRY
    save_to_file()
    _prices_df = merge_funds_historic_prices(_fund_cache.values())
    _LOG.info("Fund cache refreshed.")


def _normalise_isins(isins: Optional[Iterable[str]] = None, apply_filter: bool = True) -> Set[str]:
    """
    Normalise input isins. If None, will be replaced with all isins in fund cache.
    Calls filter_isins if apply_filter == True.
    """
    if isins is None:
        isins = _fund_cache.keys()
    if apply_filter:
        isins = filter_isins(isins)
    return set(isins)
