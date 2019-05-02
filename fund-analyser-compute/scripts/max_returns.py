import logging
from datetime import datetime
from typing import List

import matplotlib.pyplot as plt
import pandas as pd

from lib.fund.fund import Fund
from lib.util.cache import fund_cache

logging.basicConfig(level=logging.DEBUG)

NUM_PORTFOLIO = 5

peek_interval = pd.DateOffset(months=6)
hold_interval = pd.DateOffset(weeks=2)
compare_returns = pd.DateOffset(months=1)
start_date = datetime(2013, 1, 1)
today = datetime.now()

if __name__ == "__main__":
    account = pd.DataFrame([[100, "", ""]], index=[start_date], columns=["value", "isin", "name"])
    all_funds = fund_cache.get()

    start_date_minus_peek = start_date - peek_interval
    today_minus_peek = today - peek_interval
    funds = all_funds

    funds_lookup = {fund.isin: fund for fund in funds}


    def calc_returns(prices_df: pd.DataFrame, dt: datetime, duration: pd.DateOffset):
        window = prices_df[dt - duration: dt]
        return (window.iloc[-1] - window.iloc[0]) / window.iloc[0]


    def merge_funds_historic_prices(funds: List[Fund]) -> pd.DataFrame:
        all_prices = []
        daily_index = pd.date_range(start=start_date_minus_peek, end=today, freq="D")
        for fund in funds:
            prices = fund.historicPrices
            prices.name = fund.isin
            all_prices.append(prices)
        return pd.concat(all_prices, axis=1).reindex(daily_index).fillna(method="ffill")


    merged_historic_prices = merge_funds_historic_prices(funds)
    smoothed_prices = merged_historic_prices.rolling(3, center=True).mean()
    global_gradient = smoothed_prices.pct_change().diff()
    global_convexity = global_gradient.diff()


    def restrict_isins(prices_df: pd.DataFrame, dt: datetime) -> List[str]:
        def require_positive_returns(prices_df: pd.DataFrame, dt: datetime) -> List[str]:
            periods = [pd.DateOffset(months=n) for n in (3, 2, 1)] \
                      + [pd.DateOffset(weeks=n) for n in (2, 1)]
            returns = pd.concat([calc_returns(prices_df, dt, duration) for duration in periods], axis=1)
            positive_returns_indices = (returns > 0).all(axis=1)
            isins = returns.index[positive_returns_indices]
            return isins

        def avoid_downtrend(prices_df: pd.DataFrame, dt: datetime) -> List[str]:
            period = pd.DateOffset(weeks=2)
            gradient = global_gradient[dt - period: dt].median()
            convexity = global_convexity[dt - period: dt].median()
            combined = pd.concat([gradient, convexity], axis=1)
            isins = combined.index[(combined > 0).all(axis=1)]
            # isins = gradient[gradient > 0].index.intersection(convexity[convexity > 0].index)
            # if dt == datetime(2015, 8, 11):
            #     pdb.set_trace()
            return isins

        # funcs = [require_positive_returns, avoid_downtrend]
        funcs = [avoid_downtrend]
        # funcs = [require_positive_returns]
        restricted_isins = set(prices_df.columns)
        for f in funcs:
            restricted_isins &= set(f(prices_df, dt))
        return list(restricted_isins)


    for dt in pd.date_range(start=start_date, end=today - hold_interval, freq=hold_interval):
        # all_returns = calc_returns(merged_historic_prices, dt, peek_interval)
        all_returns = calc_returns(merged_historic_prices, dt, compare_returns)

        # restrict isins
        allowed_isins = restrict_isins(merged_historic_prices, dt)
        all_returns = all_returns[allowed_isins]

        next_dt = dt + hold_interval
        max_isins = all_returns.nlargest(NUM_PORTFOLIO).index

        if len(max_isins) == NUM_PORTFOLIO:
            # max_isin = all_returns[all_returns <= all_returns.quantile(0.75)].idxmax()
            max_funds = [funds_lookup[max_isin] for max_isin in max_isins]
            max_names = [f.name for f in max_funds]

            next_1m_return = calc_returns(merge_funds_historic_prices(max_funds), next_dt, hold_interval).mean()
            print(f"Dt: {dt} {max_names} {next_1m_return} Past: {all_returns.nlargest(NUM_PORTFOLIO).mean()}")
            account.loc[next_dt, :] = [account.at[dt, "value"] * (1 + next_1m_return), ",".join(max_isins), max_names]
        else:
            next_1m_return = 0
            print(f"Dt: {dt} None {next_1m_return}")
            account.loc[next_dt, :] = [account.at[dt, "value"], None, None]
    print(account.to_string())
    account.loc[:, ["value"]].plot()
    plt.show()
