import logging
from datetime import date, datetime, timedelta
from threading import Lock
from typing import Dict, Iterable, List, Optional

import numpy as np
import pandas as pd

from client.funds import stream_funds
from lib.fund.fund import Fund
from lib.util.disk import read_from_disk, write_to_disk

EXPIRY = timedelta(days=1)
_PICKLE_FUND_CACHE = "fund_cache.pickle"
_LOG = logging.getLogger(__name__)

_fund_cache: Dict[str, Fund] = dict()
_prices_df: Optional[pd.DataFrame] = None  # fast DataFrame cache for fund historicPrices
_corr_df: Optional[pd.DataFrame] = None  # correlation between price series
_expiration_time: Optional[datetime] = None
_is_full: bool = False
_lock = Lock()


def get(isins: Optional[Iterable[str]] = None) -> List[Fund]:
    """
    Returns funds corresponding to isins.
    :param isins: iterable of isins
    :return: list of funds
    """
    maybe_initialise(isins)
    isins = _normalise_isins(isins)
    return [_fund_cache[isin] for isin in isins]


def get_prices(isins: Optional[Iterable[str]] = None) -> pd.DataFrame:
    maybe_initialise(isins)
    isins = _normalise_isins(isins)
    return _prices_df[isins]  # type: ignore


def get_corr(isins: Optional[Iterable[str]] = None) -> pd.DataFrame:
    maybe_initialise(isins)
    isins = _normalise_isins(isins)
    return _corr_df.loc[isins, isins]  # type: ignore


def filter_isins(isins: Iterable[str]) -> List[str]:
    def no_entry_charge(isin: str) -> bool:
        return not _fund_cache[isin].entryCharge

    def no_bid_ask_spread(isin: str) -> bool:
        return not _fund_cache[isin].bidAskSpread

    def daily_frequency(isin: str) -> bool:
        return _fund_cache[isin].frequency == "Daily"

    def long_history(isin: str) -> bool:
        return len(_prices_df[isin].index) >= 30  # type: ignore

    TODAY = date.today()

    def up_to_date(isin: str) -> bool:
        return np.busday_count(_prices_df[isin].last_valid_index().date(), TODAY) <= 5  # type: ignore

    funcs = [no_entry_charge, no_bid_ask_spread, daily_frequency, long_history, up_to_date]
    result = isins

    for func in funcs:
        result = filter(func, result)
    return list(result)


def valid(isins: Optional[Iterable[str]]) -> bool:
    """
    Returns whether fund cache is initialised,  not expired, and contains the asking isins.
    """
    if _expiration_time is None:
        return False
    if datetime.now() > _expiration_time:
        return False
    if isins is None:
        return _is_full
    return set(_fund_cache.keys()).issuperset(isins)


def initialise(isins: Optional[Iterable[str]]) -> None:
    """
    Initialises fund cache from file or web where appropriate.
    Applies locking to ensure no redundant initialisation is performed.
    """
    _lock.acquire()
    load_from_file_or_refresh(isins)
    _lock.release()
    _LOG.info("Fund cache initialised.")


def maybe_initialise(isins: Optional[Iterable[str]]) -> None:
    if not valid(isins):
        initialise(isins)


def load_from_file_or_refresh(isins: Optional[Iterable[str]]) -> None:
    """
    Loads fund cache from file if present and not expired, else refresh from web.
    """
    try:
        load_from_file(isins)
        _LOG.debug("Successfully loaded from pickle file.")
    except (ValueError, FileNotFoundError) as e:
        _LOG.warning(e)
        refresh(isins)


def load_from_file(isins: Optional[Iterable[str]]) -> None:
    """
    Loads fund cache from file if present and not expired, else raises ValueError.
    """
    global _fund_cache, _prices_df, _corr_df, _expiration_time, _is_full
    data = read_from_disk(_PICKLE_FUND_CACHE)
    if datetime.now() > data["expiry"]:
        raise ValueError(f"Fund cache expired at: {data['expiry']}")
    _fund_cache, _prices_df, _corr_df, _expiration_time, _is_full = \
        data["funds"], data["prices_df"], data["corr_df"], data["expiry"], data["is_full"]
    if not valid(isins):
        raise ValueError(f"Fund cache needs refresh because it doesn't contain all isins: {isins}")


def save_to_file() -> None:
    """
    Saves in-memory fund cache to file.
    :return:
    """
    global _fund_cache, _prices_df, _corr_df, _expiration_time, _is_full
    write_to_disk(_PICKLE_FUND_CACHE, {
        "funds": _fund_cache,
        "prices_df": _prices_df,
        "corr_df": _corr_df,
        "expiry": _expiration_time,
        "is_full": _is_full
    })


def refresh(isins: Optional[Iterable[str]]) -> None:
    """
    Builds a fresh copy of fund cache from web.
    """
    global _fund_cache, _prices_df, _corr_df, _expiration_time, _is_full
    _LOG.info("Refreshing fund cache...")
    _fund_cache = dict()
    all_prices = []
    counter = 0
    for fund_stream_entry in stream_funds(isins):
        counter += 1
        fund = fund_stream_entry.fund
        _LOG.debug(f"Fund {counter} {fund.isin} received.")
        _fund_cache[fund.isin] = fund
        all_prices.append(fund_stream_entry.historic_prices)
    _LOG.debug("Merging fund historic prices...")
    _prices_df = pd.concat(all_prices, axis=1).resample("B").asfreq().fillna(method="ffill")
    _corr_df = _prices_df.truncate(before=date.today() - pd.DateOffset(years=1)).corr()
    _expiration_time = datetime.now() + EXPIRY
    _is_full = isins is None
    save_to_file()
    _LOG.info("Fund cache refreshed.")


def _normalise_isins(isins: Optional[Iterable[str]] = None) -> List[str]:
    """
    Normalise input isins. If None, will be replaced with filtered isins in fund cache.
    """
    if isins is None:
        return filter_isins(_fund_cache.keys())
    else:
        return list(isins)
