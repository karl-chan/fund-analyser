import logging
import os
import pickle
import tempfile
from datetime import timedelta, datetime, date
from typing import Iterable, Set, Dict

import numpy as np

from client.funds import stream_funds
from lib.fund.fund import Fund

FILE_TMP_CACHE = os.path.join(tempfile.gettempdir(), "fund_cache.pickle")
EXPIRY = timedelta(days=1)

fund_cache: Dict[str, Fund] = dict()


def refresh():
    global fund_cache
    logging.info("Refreshing fund cache...")
    fund_cache = dict()
    counter = 0
    for fund in stream_funds():
        counter += 1
        logging.debug(f"Fund {counter} {fund.isin} received.")
        fund_cache[fund.isin] = fund
    save_to_file()
    logging.info("Fund cache refreshed.")


def get(isins: Iterable[str] = None, constraints=True):
    try:
        load_from_file()
        logging.debug("Successfully loaded from pickle file.")
    except (ValueError, FileNotFoundError) as e:
        logging.warning(e)
        refresh()

    if isins:
        isin_set = set(isins)
    else:
        isin_set = fund_cache.keys()

    if constraints:
        isin_set = filter_isins(isin_set)

    return [fund_cache[isin] for isin in isin_set]


def filter_isins(isins_set: Set[str]) -> Set[str]:
    def no_entry_charge(isin: str) -> bool:
        return not fund_cache[isin].entryCharge

    def no_bid_ask_spread(isin: str) -> bool:
        return not fund_cache[isin].bidAskSpread

    def daily_frequency(isin: str) -> bool:
        return fund_cache[isin].frequency == "Daily"

    def long_history(isin: str) -> bool:
        return len(fund_cache[isin].historicPrices) >= 30

    TODAY = date.today()

    def up_to_date(isin: str) -> bool:
        return np.busday_count(fund_cache[isin].historicPrices.last_valid_index().date(), TODAY) <= 5

    funcs = [no_entry_charge, no_bid_ask_spread, daily_frequency, long_history, up_to_date]
    result = isins_set

    for func in funcs:
        result = filter(func, result)
    return result


def load_from_file():
    global fund_cache
    with open(FILE_TMP_CACHE, "rb") as file:
        data = pickle.load(file)
    expiry = data["expiry"]
    if datetime.now() > expiry:
        raise ValueError(f"Fund cache expired at: {expiry}")
    fund_cache = data["funds"]


def save_to_file():
    global fund_cache
    with open(FILE_TMP_CACHE, "wb") as file:
        data = {
            "expiry": datetime.now() + EXPIRY,
            "funds": fund_cache
        }
        pickle.dump(data, file)
