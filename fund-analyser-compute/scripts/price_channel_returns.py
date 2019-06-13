import logging
from datetime import datetime, date
from typing import List

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import talib
from ffn import calc_max_drawdown, calc_risk_return_ratio

from lib.fund import fund_cache
from lib.fund.fund_utils import merge_funds_historic_prices, calc_fees, calc_returns, price_channels

logging.basicConfig(level=logging.DEBUG)
pd.set_option('display.max_colwidth', 10000)

NUM_PORTFOLIO = 5
BDAY = pd.tseries.offsets.BusinessDay(n=1)

peek_interval = 25
hold_interval = 5 * BDAY
compare_returns = pd.DateOffset(months=6)
buy_sell_gap = BDAY
# start_date = date(2013, 5, 8)
# end_date = date(2019, 5, 8)
start_date = (date.today() - pd.DateOffset(years=5)).date()
end_date = (date.today() - pd.DateOffset(days=2)).date()

funds = fund_cache.get()
funds_lookup = {fund.isin: fund for fund in funds}

merged_historic_prices = merge_funds_historic_prices(funds)
daily_returns = merged_historic_prices.pct_change()
fees_df = calc_fees(funds)

lower_channel, upper_channel = price_channels(merged_historic_prices, timeperiod=peek_interval)
lt_channel = merged_historic_prices < lower_channel
btw_channel = (lower_channel < merged_historic_prices) & (merged_historic_prices < upper_channel)
gt_channel = upper_channel < merged_historic_prices

rsis = merged_historic_prices.apply(talib.RSI)
low_rsis = rsis.lt(25)


def simulate_run(start_date: date):
    account = pd.DataFrame([[100, "", ""]], index=[start_date], columns=["value", "isin", "name"])

    def restrict_isins(prices_df: pd.DataFrame, dt: datetime) -> List[str]:
        def exit_price_channel():
            ytd = dt - BDAY
            ytd_cond = merged_historic_prices.loc[ytd, :] < upper_channel.loc[ytd, :]
            ytd_isins = merged_historic_prices.loc[ytd, :][ytd_cond].index

            today_cond = merged_historic_prices.loc[dt, :] > upper_channel.loc[dt, :]
            today_isins = merged_historic_prices.loc[dt, :][today_cond].index
            return ytd_isins.intersection(today_isins)

        def enter_price_channel():
            ytd = dt - BDAY
            ytd_cond = merged_historic_prices.loc[ytd, :] < lower_channel.loc[ytd, :]
            ytd_isins = merged_historic_prices.loc[ytd, :][ytd_cond].index

            today_cond = merged_historic_prices.loc[dt, :] > lower_channel.loc[dt, :]
            today_isins = merged_historic_prices.loc[dt, :][today_cond].index
            return ytd_isins.intersection(today_isins)

        def exit_or_enter_price_channel():
            return exit_price_channel().union(enter_price_channel())

        def rebound_within_channel():
            all_btw_channel = btw_channel.loc[dt - 2 * BDAY: dt, :].all(axis=0)
            all_isins = all_btw_channel.index[all_btw_channel]

            ytd_returns = daily_returns.loc[dt - BDAY, :]
            today_returns = daily_returns.loc[dt, :]
            ytd_isins = ytd_returns[ytd_returns < 0].index
            today_isins = today_returns[today_returns > 0].index

            return set.intersection(
                set(all_isins),
                set(ytd_isins),
                set(today_isins)
            )

        def only_low_rsi() -> List[str]:
            ytd = dt - BDAY
            ytd_low = low_rsis.loc[ytd, :]
            return ytd_low.index[ytd_low]

        # funcs = [enter_price_channel]
        funcs = [rebound_within_channel]
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

        def random_tiebreaker() -> List[str]:
            try:
                return np.random.choice(isins, size=NUM_PORTFOLIO, replace=False)
            except ValueError as e:
                return isins

        isins = max_6m_returns()
        # isins = random_tiebreaker()
        return isins

    dt = start_date
    while dt < end_date:
        allowed_isins = restrict_isins(merged_historic_prices, dt)
        max_isins = tiebreak_isins(allowed_isins, dt)

        if len(max_isins):
            next_dt = (dt + hold_interval).date()
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
