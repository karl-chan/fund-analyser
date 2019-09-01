import logging
from datetime import datetime, date
from typing import List

import matplotlib.pyplot as plt
import pandas as pd
from ffn import calc_max_drawdown, calc_risk_return_ratio

from lib.fund import fund_cache
from lib.fund.fund_utils import merge_funds_historic_prices, calc_fees, calc_returns
from lib.indicators.indicator_utils import ppo

logging.basicConfig(level=logging.DEBUG)
pd.set_option('display.max_colwidth', 10000)

NUM_PORTFOLIO = 1
BDAY = pd.tseries.offsets.BusinessDay(n=1)

peek_interval = pd.DateOffset(months=6)
hold_interval = 5 * BDAY
compare_returns = pd.DateOffset(months=6)
buy_sell_gap = BDAY
# start_date = date(2013, 5, 8)
# end_date = date(2019, 5, 8)
start_date = (date.today() - pd.DateOffset(years=5)).date()
end_date = (date.today() - pd.DateOffset(days=1)).date()

funds = fund_cache.get()
funds_lookup = {fund.isin: fund for fund in funds}

merged_historic_prices = merge_funds_historic_prices(funds)
daily_returns = merged_historic_prices.pct_change()
fees_df = calc_fees(funds)

ppo_df, pposignal, ppohist = ppo(merged_historic_prices)
ppo_sign = ppo_df > 0
ppo_df_grad = ppo_df.diff()
ppohist_pos = (ppohist > 0)
ppohist_grad_pos = ppohist.diff() > 0
ppohist_sign_change = ppohist_pos.astype("int").diff().abs()


def simulate_run(start_date: date):
    account = pd.DataFrame([[100, "", ""]], index=[start_date], columns=["value", "isin", "name"])

    def restrict_isins(prices_df: pd.DataFrame, dt: datetime) -> List[str]:
        def min_ppo() -> List[str]:
            isins = prices_df.loc[dt, :].nlargest(NUM_PORTFOLIO).index
            return isins

        funcs = [min_ppo]
        restricted_isins = set(prices_df.columns)
        for f in funcs:
            restricted_isins &= set(f())
        return list(restricted_isins)

    def tiebreak_isins(isins: List[str], dt: datetime) -> List[str]:
        def max_6m_returns() -> List[str]:
            restricted_returns = calc_returns(merged_historic_prices[isins], dt, compare_returns, fees_df)
            max_isins = restricted_returns.nlargest(NUM_PORTFOLIO).index
            print(f"Dt: {dt} {max_isins} Past: {restricted_returns[max_isins].mean()}")
            return max_isins

        isins = max_6m_returns()
        return isins

    dt = start_date
    while dt < end_date:
        allowed_isins = restrict_isins(merged_historic_prices, dt)
        max_isins = tiebreak_isins(allowed_isins, dt)

        if len(max_isins):
            next_dt = (dt + hold_interval).date()
            # max_isin = all_returns[all_returns <= all_returns.quantile(0.75)].idxmax()
            max_funds = [funds_lookup[max_isin] for max_isin in max_isins]
            max_names = [f.name for f in max_funds]

            next_1m_return = calc_returns(merge_funds_historic_prices(max_funds), next_dt, hold_interval,
                                          fees_df).mean()
            account.loc[next_dt, :] = [account.iloc[-1, :]["value"] * (1 + next_1m_return), ",".join(max_isins),
                                       max_names]
            dt = (next_dt + buy_sell_gap).date()
        else:
            next_dt = (dt + BDAY).date()
            # carry forward
            account.loc[next_dt, :] = [account.iloc[-1, :]["value"], None, None]
            dt = next_dt
    return account


if __name__ == "__main__":
    results = []
    for run_begin_date in [datetime(2014, 5, 22)]:
        # for run_begin_date in pd.date_range(start_date, start_date + hold_interval, freq='B'):
        account = simulate_run(run_begin_date.date())
        print(account.to_string())
        returns = (account.iloc[-1, :].loc["value"] - account.iloc[0, :].loc["value"]) / account.iloc[0, :].loc[
            "value"]
        drawdown = calc_max_drawdown(account["value"])
        sharpe_ratio = calc_risk_return_ratio(account["value"])
        results.append((run_begin_date, account, returns, drawdown, sharpe_ratio))

    sorted_results = sorted(results, key=lambda tup: tup[2])
    min_begin_date, min_account, min_return, _, _ = sorted_results[0]
    max_begin_date, max_account, max_return, _, _ = sorted_results[-1]
    print(f"Min returns: {min_return} Begin date: {min_begin_date}")
    print(f"Max returns: {max_return} Begin date: {max_begin_date}")

    sorted_drawdowns = sorted(results, key=lambda tup: tup[3])
    max_drawdown_date, _, _, max_drawdown, _ = sorted_drawdowns[0]
    print(f"Max drawdown: {max_drawdown} Begin date: {max_drawdown_date}")

    sorted_sharpe_ratios = sorted(results, key=lambda tup: tup[4])
    min_sharpe_date, _, _, _, min_sharpe_ratio = sorted_sharpe_ratios[0]
    print(f"Min sharpe ratio: {min_sharpe_ratio} Begin date: {min_sharpe_date}")

    returns_hist = pd.DataFrame([tup[2] for tup in sorted_results], index=[tup[0] for tup in sorted_results])
    returns_hist.hist()

    min_account.loc[:, ["value"]].plot()
    max_account.loc[:, ["value"]].plot()
    plt.show()
