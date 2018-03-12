from util.db import db
import requests
from bs4 import BeautifulSoup
import json
import pandas as pd

sources = ["db", "ft"]

def get_historic_prices(isin, source="db"):
    if source not in sources:
        raise ValueError("Source must be one of {}".format(sources))

    if source == "db":
        return get_historic_prices_from_db(isin)
    if source == "ft":
        return get_historic_prices_from_ft(isin)


def get_historic_prices_from_db(isin):
    document = db.funds.find_one({"_id": isin}, {"historicPrices": 1})
    dict = document["historicPrices"]
    df = pd.DataFrame.from_dict(dict)
    df = df.set_index("date")
    df.index = pd.to_datetime(df.index)
    historic_prices = df["price"]
    return historic_prices


def get_historic_prices_from_ft(isin):
    url = "https://markets.ft.com/data/funds/tearsheet/charts?s={}"
    css_selector = """body > div.o-grid-container.mod-container > div.ichart-container
    > div:nth-of-type(1) > section:nth-of-type(1) > div > div
    > div.mod-ui-overlay.clearfix.mod-overview-quote-app-overlay > div > div
    > section.mod-tearsheet-add-to-watchlist"""

    r = requests.get(url.format(isin))
    soup = BeautifulSoup(r.content, "lxml")
    xid = json.loads(soup.select(css_selector)[0]["data-mod-config"])["xid"]

    url = "https://markets.ft.com/data/chartapi/series"
    headers = {
        "content-type": "application/json"
    }
    payload = {
        "days": 10000,
        "dataPeriod": "Day",
        "returnDateType": "ISO8601",
        "elements": [{"Type": "price", "Symbol": xid}]
    }
    r = requests.post(url, headers=headers, data=json.dumps(payload))
    series = r.json()
    dates = series["Dates"]
    prices = next(s for s in series["Elements"][0]["ComponentSeries"] if s["Type"] == "Close")["Values"]
    price_series = pd.Series(prices, index=pd.to_datetime(dates))
    return price_series