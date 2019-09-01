import logging
from datetime import date, datetime

import matplotlib.pyplot as plt
import pandas as pd
from ffn import calc_max_drawdown, calc_risk_return_ratio

from lib.fund import fund_cache
from lib.fund.fund_utils import merge_funds_historic_prices, calc_fees

logging.basicConfig(level=logging.DEBUG)
pd.set_option('display.max_colwidth', 10000)

BDAY = pd.tseries.offsets.BusinessDay(n=1)

peek_interval = pd.DateOffset(months=6)
hold_interval = 5 * BDAY
compare_returns = pd.DateOffset(months=6)
buy_sell_gap = BDAY
# start_date = date(2013, 5, 8)
# end_date = date(2019, 5, 8)
start_date = (date.today() - pd.DateOffset(years=5)).date()
end_date = (date.today() - pd.DateOffset(days=0)).date()

WATCHLIST = [
    # "GB00B1XFGM25",
    # "GB00B4TZHH95",
    "GB00B8JYLC77",
    # "GB00B80QFR50",
    # "GB00B39RMM81",
    "GB00B80QG615",
    # "GB00B99C0657",
    # "GB00BH57C751",
    # "GB0006061963",
    # "IE00B4WL8048",
    # "IE00B90P3080",
    # "LU0827884411",
]
funds = fund_cache.get(WATCHLIST)
funds_lookup = {fund.isin: fund for fund in funds}

merged_historic_prices = merge_funds_historic_prices(funds)
daily_returns = merged_historic_prices.pct_change()
fees_df = calc_fees(funds)


def simulate_run(start_date: date):
    isins = [f.isin for f in funds]
    names = [f.name for f in funds]

    pct_changes = merged_historic_prices[isins] \
        .pct_change() \
        .truncate(before=start_date, after=end_date) \
        .add(1) \
        .resample(hold_interval) \
        .prod() \
        .mean(axis=1)

    prices = pct_changes.copy()
    prices.iloc[0] = 100
    account = prices.cumprod().to_frame(name="value")
    account["isin"] = ",".join(isins)
    account["name"] = ",".join(names)
    return account


if __name__ == "__main__":
    results = []
    for run_begin_date in [datetime(2014, 8, 21)]:
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
