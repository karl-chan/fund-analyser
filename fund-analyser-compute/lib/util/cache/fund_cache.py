import logging
import os
import pickle
from datetime import timedelta, datetime
from typing import Iterable

from client.funds import stream_funds

FILE_TMP_CACHE = os.path.join(os.path.dirname(__file__), "fund_cache.pickle")
EXPIRY = timedelta(days=1)

fund_cache = []


def refresh():
    global fund_cache
    logging.info("Refreshing fund cache...")
    fund_cache = []
    counter = 0
    for fund in stream_funds():
        counter += 1
        logging.debug(f"Fund {counter} {fund.isin} received.")
        fund_cache.append(fund)
    save_to_file()
    logging.info("Fund cache refreshed.")


def get(isins: Iterable[str] = None):
    try:
        load_from_file()
        logging.debug("Successfully loaded from pickle file.")
    except (ValueError, FileNotFoundError) as e:
        logging.warning(e)
        refresh()

    if isins:
        isin_set = set(isins)
        return [fund for fund in fund_cache if fund.isin in isin_set]
    else:
        return fund_cache


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
