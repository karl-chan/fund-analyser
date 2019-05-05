import logging
import multiprocessing
from datetime import datetime

import matplotlib.pyplot as plt
import pandas as pd

from lib.fund import fund_cache
from lib.fund.fund_utils import merge_funds_historic_prices, calc_returns, calc_fees

logging.basicConfig(level=logging.DEBUG)

NUM_PORTFOLIO = 5

peek_interval = pd.DateOffset(months=6)
hold_interval = pd.DateOffset(months=1)
start_date = datetime(2013, 1, 1)
today = datetime.now()

all_funds = fund_cache.get()

start_date_minus_peek = start_date - peek_interval
today_minus_peek = today - peek_interval

merged_historic_prices = merge_funds_historic_prices(all_funds)
fees_df = calc_fees(all_funds)


def simulate_run(trial_num: int) -> pd.Series:
    account = pd.DataFrame([[100, "", ""]], index=[start_date], columns=["value", "isin", "name"])

    funds = all_funds
    funds_lookup = {fund.isin: fund for fund in funds}

    for dt in pd.date_range(start=start_date, end=today - hold_interval, freq=hold_interval):
        next_dt = dt + hold_interval
        next_returns = calc_returns(merged_historic_prices, next_dt, hold_interval, fees_df)

        random_isins = next_returns.dropna().sample(n=NUM_PORTFOLIO).index
        random_funds = [funds_lookup[isin] for isin in random_isins]
        random_names = [f.name for f in random_funds]

        next_1m_return = next_returns[random_isins].mean()
        account.loc[next_dt, :] = [account.at[dt, "value"] * (1 + next_1m_return), ",".join(random_isins),
                                   ",".join(random_names)]
    # print(account.to_string())
    print(trial_num)
    return account.loc[:, ["value"]].squeeze()

    # account.loc[:, ["value"]].plot()
    # plt.show()


if __name__ == "__main__":
    with multiprocessing.Pool(4) as pool:
        accounts = pd.concat(pool.map(simulate_run, range(100)), axis=1)
    # accounts = pd.concat([simulate_run(i) for i in range(100)], axis=1)
    returns = (accounts.iloc[-1] - accounts.iloc[0]) / accounts.iloc[0] * 100
    print(returns)
    print(returns.describe())
    returns.hist()
    plt.show()
