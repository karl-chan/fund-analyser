import logging
from datetime import datetime, date
from typing import List

import matplotlib.pyplot as plt
import pandas as pd
from ffn import calc_max_drawdown, calc_risk_return_ratio

from lib.fund import fund_cache
from lib.fund.fund_utils import merge_funds_historic_prices, calc_fees, calc_returns, adx

logging.basicConfig(level=logging.DEBUG)
pd.set_option('display.max_colwidth', 10000)

NUM_PORTFOLIO = 2

peek_interval = pd.DateOffset(months=6)
hold_interval = pd.tseries.offsets.BusinessDay(n=5)
compare_returns = pd.DateOffset(months=6)
buy_sell_gap = pd.tseries.offsets.BusinessDay(n=1)
# start_date = date(2013, 5, 8)
# end_date = date(2019, 5, 8)
start_date = (date.today() - pd.DateOffset(years=5)).date()
end_date = date.today()

funds = fund_cache.get()
funds_lookup = {fund.isin: fund for fund in funds}

merged_historic_prices = merge_funds_historic_prices(funds)
fees_df = calc_fees(funds)
adxs, plus_dis, minus_dis = adx(merged_historic_prices)
# adxs_diff = adxs.diff()
adxs_strong_sign = adxs.gt(25)
adxs_grad_sign = adxs.diff().gt(0)
diff_dis = plus_dis - minus_dis
# plus_dis_diff = plus_dis.diff()
# minus_dis_diff = minus_dis.diff()
diff_dis_sign = diff_dis.gt(0)
diff_dis_grad = diff_dis.diff()
diff_dis_grad_sign = diff_dis_grad.gt(0)


# negative_counts = (global_gradient < 0).sum(axis=1)


def simulate_run(start_date: date):
    account = pd.DataFrame([[100, "", ""]], index=[start_date], columns=["value", "isin", "name"])

    def restrict_isins(prices_df: pd.DataFrame, dt: datetime) -> List[str]:
        def max_adx() -> List[str]:
            period = pd.tseries.offsets.BusinessDay(n=3)

            strong_adx_isins = adxs_strong_sign.columns[adxs_strong_sign[dt - period:dt].all(axis=0)]
            # inc_adx_isins = adxs_grad_sign.columns[adxs_grad_sign[dt - period:dt].all(axis=0)]
            # dis_pos_isins = diff_dis_sign.columns[diff_dis_sign[dt - period:dt].all(axis=0)]
            diverging_di_isins = diff_dis_grad_sign.columns[diff_dis_grad_sign[dt - period: dt].all(axis=0)]

            isins = set.intersection(
                set(strong_adx_isins),
                # set(inc_adx_isins),
                # set(dis_pos_isins),
                set(diverging_di_isins)
            )
            return isins

        funcs = [max_adx]
        restricted_isins = set(prices_df.columns)
        for f in funcs:
            restricted_isins &= set(f())
        return list(restricted_isins)

    def tiebreak_isins(isins: List[str], dt: datetime) -> List[str]:
        def max_6m_returns() -> List[str]:
            restricted_returns = calc_returns(merged_historic_prices[isins], dt, compare_returns, fees_df)
            max_isins = restricted_returns.nlargest(NUM_PORTFOLIO).index
            print(f"Dt: {dt} {','.join(list(max_isins))} Past: {restricted_returns[max_isins].mean()}")
            return max_isins

        def max_drawup_drawdown_ratio() -> List[str]:
            restricted_prices = merged_historic_prices.loc[dt - compare_returns: dt, isins]
            drawups = (restricted_prices / restricted_prices.expanding(min_periods=1).min()).max() - 1
            drawdowns = calc_max_drawdown(restricted_prices)
            return (drawups / -drawdowns).nlargest(NUM_PORTFOLIO).index

        def max_range() -> List[str]:
            restricted_prices = merged_historic_prices.loc[dt - compare_returns: dt, isins]
            min_prices = restricted_prices.min(axis=0)
            max_prices = restricted_prices.max(axis=0)
            median_prices = restricted_prices.median(axis=0)
            range_prices = (max_prices - min_prices) / median_prices
            return range_prices.nlargest(NUM_PORTFOLIO).index

        isins = max_range()
        return isins if len(isins) == NUM_PORTFOLIO else []

    dt = start_date
    while dt < end_date:
        next_dt = (dt + hold_interval).date()
        allowed_isins = restrict_isins(merged_historic_prices, dt)
        max_isins = tiebreak_isins(allowed_isins, dt)

        if len(max_isins):
            # max_isin = all_returns[all_returns <= all_returns.quantile(0.75)].idxmax()
            max_funds = [funds_lookup[max_isin] for max_isin in max_isins]
            max_names = [f.name for f in max_funds]

            next_1m_return = calc_returns(merge_funds_historic_prices(max_funds), next_dt, hold_interval,
                                          fees_df).mean()
            account.loc[next_dt, :] = [account.iloc[-1, :]["value"] * (1 + next_1m_return), ",".join(max_isins),
                                       max_names]
        else:
            # carry forward
            account.loc[next_dt, :] = [account.iloc[-1, :]["value"], None, None]
        dt = (next_dt + buy_sell_gap).date()
    return account


if __name__ == "__main__":
    results = []
    for run_begin_date in [datetime(2014, 5, 19)]:
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
