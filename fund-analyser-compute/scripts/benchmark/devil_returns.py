import logging
from datetime import datetime

import matplotlib.pyplot as plt
import pandas as pd

from lib.fund import fund_cache
from lib.fund.fund_utils import merge_funds_historic_prices, calc_fees, calc_returns

logging.basicConfig(level=logging.DEBUG)

peek_interval = pd.DateOffset(months=6)
hold_interval = pd.DateOffset(months=1)
start_date = datetime(2013, 1, 1)
today = datetime.now()

all_funds = fund_cache.get()

start_date_minus_peek = start_date - peek_interval
today_minus_peek = today - peek_interval

merged_historic_prices = merge_funds_historic_prices(all_funds)
fees_df = calc_fees(all_funds)

if __name__ == "__main__":
    account = pd.DataFrame([[100, "", ""]], index=[start_date], columns=["value", "isin", "name"])

    funds = all_funds
    funds_lookup = {fund.isin: fund for fund in funds}

    for dt in pd.date_range(start=start_date, end=today - hold_interval, freq=hold_interval):
        next_dt = dt + hold_interval
        next_returns = calc_returns(merged_historic_prices, next_dt, hold_interval, fees_df)

        isin = next_returns.idxmin()
        name = funds_lookup[isin].name

        next_1m_return = next_returns[isin]
        print(f"Dt: {dt} {name} {next_1m_return}")
        account.loc[next_dt, :] = [account.at[dt, "value"] * (1 + next_1m_return), isin, name]

    print(account.to_string())
    print("Average return: " + str(account[["value"]].pct_change().mean()))

    account.loc[:, ["value"]].plot()
    plt.show()
