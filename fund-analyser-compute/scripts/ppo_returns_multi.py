from datetime import datetime, date

import matplotlib.pyplot as plt
import pandas as pd
import talib
from talib._ta_lib import MA_Type

from lib.fund import fund_cache
from lib.fund.fund_utils import merge_funds_historic_prices, calc_returns, calc_fees

NUM_PORTFOLIO = 5

peek_interval = pd.DateOffset(months=6)
hold_interval = pd.DateOffset(months=1)
start_date = datetime(2013, 1, 2)
today = datetime.now()

if __name__ == "__main__":
    account = pd.DataFrame([[100, "", ""]], index=[start_date], columns=["value", "isin", "name"])
    all_funds = fund_cache.get()

    start_date_minus_peek = date(2001, 1, 1)  # start_date - peek_interval
    today_minus_peek = today - peek_interval
    funds = all_funds

    funds_lookup = {fund.isin: fund for fund in funds}

    merged_historic_prices = merge_funds_historic_prices(funds)
    fees_df = calc_fees(funds)

    long_ppos = merged_historic_prices.apply(lambda s: talib.PPO(s, fastperiod=20, slowperiod=60, matype=MA_Type.EMA))
    short_ppos = merged_historic_prices.apply(lambda s: talib.PPO(s, fastperiod=3, slowperiod=6, matype=MA_Type.EMA))
    # rsis = merged_historic_prices.apply(talib.RSI)

    for dt in pd.date_range(start=start_date, end=today - hold_interval, freq=hold_interval):
        next_dt = dt + hold_interval

        formula = pd.concat(
            [long_ppos.loc[dt, :], short_ppos.loc[dt, :],
             (1 + long_ppos.loc[dt, :]) * (1 + short_ppos.loc[dt, :])], axis=1)
        max_isins = formula[
                        (formula.iloc[:, 0] > 0) & (formula.iloc[:, 1] > 0) & (
                                formula.iloc[:, 2] > 0)].iloc[:, 2].nlargest(NUM_PORTFOLIO).index
        if len(max_isins) == NUM_PORTFOLIO:
            max_funds = [funds_lookup[max_isin] for max_isin in max_isins]
            max_names = [f.name for f in max_funds]

            next_1m_return = calc_returns(merge_funds_historic_prices(max_funds), next_dt, hold_interval,
                                          fees_df).mean()
            print(f"Dt: {dt} {max_names} {next_1m_return} "
                  f"{formula.loc[max_isins]}")
            account.loc[next_dt, :] = [account.at[dt, "value"] * (1 + next_1m_return), ",".join(max_isins), max_names]
        else:
            next_1m_return = 0
            print(f"Dt: {dt} None {next_1m_return}")
            account.loc[next_dt, :] = [account.at[dt, "value"], None, None]
    print(account.to_string())
    account.loc[:, ["value"]].plot()
    plt.show()
