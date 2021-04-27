from datetime import datetime
from threading import Lock
from typing import Dict, Iterable, List, Optional, Tuple

import pandas as pd

from client.stocks import stream_stocks
from lib.stock.stock import Stock
from lib.util.dates import BDAY
from lib.util.disk import read_from_disk, write_to_disk
from lib.util.logging_utils import log_debug, log_info, log_warning

EXPIRY = 2 * BDAY
_PICKLE_STOCK_CACHE = "stock_cache.pickle"

_stock_cache: Dict[str, Stock] = dict()
_prices_df: Optional[pd.DataFrame] = None
_volume_df: Optional[pd.DataFrame] = None
_expiration_time: Optional[datetime] = None
_is_full: bool = False
_lock = Lock()


def get(symbols: Optional[Iterable[str]] = None) -> List[Stock]:
    """
    Returns stocks corresponding to symbols.
    :param symbols: iterable of symbols
    :return: list of stocks
    """
    maybe_initialise(symbols)
    symbols = _normalise_symbols(symbols)
    return [_stock_cache[symbol] for symbol in symbols]


def get_prices(symbols: Optional[Iterable[str]] = None) -> Tuple[pd.DataFrame, pd.DataFrame]:
    maybe_initialise(symbols)
    symbols = _normalise_symbols(symbols)
    return (_prices_df[symbols],  # type: ignore
            _volume_df[symbols])  # type: ignore


def valid(symbols: Optional[Iterable[str]]) -> bool:
    """
    Returns whether stock cache is initialised,  not expired, and contains the asking symbols.
    """
    if _expiration_time is None:
        return False
    if datetime.now() > _expiration_time:
        return False
    if symbols is None:
        return _is_full
    return set(_stock_cache.keys()).issuperset(symbols)


def initialise(symbols: Optional[Iterable[str]]) -> None:
    """
    Initialises stock cache from file or web where appropriate.
    Applies locking to ensure no redundant initialisation is performed.
    """
    _lock.acquire()
    load_from_file_or_refresh(symbols)
    _lock.release()
    log_info("Stock cache initialised.")


def maybe_initialise(symbols: Optional[Iterable[str]]) -> None:
    if not valid(symbols):
        initialise(symbols)


def load_from_file_or_refresh(symbols: Optional[Iterable[str]]) -> None:
    """
    Loads stock cache from file if present and not expired, else refresh from web.
    """
    try:
        load_from_file(symbols)
        log_debug("Successfully loaded from pickle file.")
    except (ValueError, FileNotFoundError) as e:
        log_warning(e)
        refresh(symbols)


def load_from_file(symbols: Optional[Iterable[str]]) -> None:
    """
    Loads stock cache from file if present and not expired, else raises ValueError.
    """
    global _stock_cache, _prices_df, _volume_df, _expiration_time, _is_full
    data = read_from_disk(_PICKLE_STOCK_CACHE)
    if datetime.now() > data["expiry"]:
        raise ValueError(f"Stock cache expired at: {data['expiry']}")
    _stock_cache, _prices_df, _volume_df, _expiration_time, _is_full = \
        data["stocks"], data["prices_df"], data["volume_df"], data["expiry"], data["is_full"]
    if not valid(symbols):
        raise ValueError(f"Stock cache needs refresh because it doesn't contain all symbols: {symbols}")


def save_to_file() -> None:
    """
    Saves in-memory stock cache to file.
    :return:
    """
    global _stock_cache, _prices_df, _volume_df, _expiration_time, _is_full
    write_to_disk(_PICKLE_STOCK_CACHE, {
        "stocks": _stock_cache,
        "prices_df": _prices_df,
        "volume_df": _volume_df,
        "expiry": _expiration_time,
        "is_full": _is_full
    })


def refresh(symbols: Optional[Iterable[str]]) -> None:
    """
    Builds a fresh copy of stock cache from web.
    """
    global _stock_cache, _prices_df, _volume_df, _expiration_time, _is_full
    log_info("Refreshing stock cache...")
    _stock_cache = dict()
    combined_prices = []
    counter = 0
    for stock_stream_entry in stream_stocks(symbols):
        counter += 1
        stock = stock_stream_entry.stock
        log_debug(f"Stock {counter} {stock.symbol} received.")
        _stock_cache[stock.symbol] = stock
        combined_prices.append(stock_stream_entry.historic_prices)
    log_debug("Merging stock historic prices...")
    _combined_df = pd.concat(combined_prices, axis=1).resample("B").asfreq().fillna(method="ffill")
    _prices_df, _volume_df = _combined_df[["price"]], _combined_df[["volume"]]
    _prices_df.columns = _volume_df.columns = _stock_cache.keys()
    _expiration_time = _prices_df.last_valid_index() + EXPIRY
    _is_full = symbols is None
    save_to_file()
    log_info("Stock cache refreshed.")


def _normalise_symbols(symbols: Optional[Iterable[str]] = None) -> List[str]:
    """
    Normalise input symbols. If None, will be replaced with filtered symbols in stock cache.
    """
    return list(symbols if symbols is not None else _stock_cache.keys())
