from datetime import datetime

import matplotlib.pyplot as plt
import pandas as pd
import talib
from talib._ta_lib import MA_Type

from lib.fund import fund_cache
from lib.fund.fund_utils import merge_funds_historic_prices, calc_returns, calc_fees

peek_interval = pd.DateOffset(months=6)
hold_interval = pd.DateOffset(weeks=2)
start_date = datetime(2013, 1, 1)
today = datetime.now()

if __name__ == "__main__":
    account = pd.DataFrame([[100, "", ""]], index=[start_date], columns=["value", "isin", "name"])
    all_funds = fund_cache.get()

    start_date_minus_peek = start_date - peek_interval
    today_minus_peek = today - peek_interval
    funds = all_funds

    funds_lookup = {fund.isin: fund for fund in funds}

    merged_historic_prices = merge_funds_historic_prices(funds)
    fees_df = calc_fees(all_funds)

    long_ppos = merged_historic_prices.apply(lambda s: talib.PPO(s, fastperiod=20, slowperiod=60, matype=MA_Type.EMA))
    short_ppos = merged_historic_prices.apply(lambda s: talib.PPO(s, fastperiod=3, slowperiod=6, matype=MA_Type.EMA))
    # rsis = merged_historic_prices.apply(talib.RSI)

    for dt in pd.date_range(start=start_date, end=today - hold_interval, freq=hold_interval):
        next_dt = dt + hold_interval

        if len(short_ppos.loc[dt, :].dropna()):
            # max_isin = long_ppos.loc[dt, :].idxmin()
            max_isin = (-long_ppos.loc[dt, :] * short_ppos.loc[dt, :].pow(2)).idxmax()
            # max_isin = (macds.loc[dt, :] / rsis.loc[dt, :]).replace([np.inf, -np.inf], np.nan).idxmax()
            max_fund = funds_lookup[max_isin]

            next_1m_return = calc_returns(max_fund.historicPrices, next_dt, hold_interval, fees_df)
            print(f"Dt: {dt} {max_fund.name} {next_1m_return} "
                  f"{long_ppos.loc[dt, max_isin]} {short_ppos.loc[dt, max_isin]}")
            account.loc[next_dt, :] = [account.at[dt, "value"] * (1 + next_1m_return), max_isin, max_fund.name]
        else:
            next_1m_return = 0
            print(f"Dt: {dt} None {next_1m_return}")
            account.loc[next_dt, :] = [account.at[dt, "value"], None, None]
    print(account.to_string())
    account.loc[:, ["value"]].plot()
    plt.show()
