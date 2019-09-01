import logging
from datetime import datetime, date
from typing import List

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from ffn import calc_max_drawdown, calc_risk_return_ratio

from lib.fund import fund_cache
from lib.fund.fund_utils import merge_funds_historic_prices, calc_fees, calc_returns, calc_hold_interval
from lib.indicators.indicator_utils import bollinger_bands

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
end_date = (date.today() - pd.DateOffset(days=5)).date()

funds = fund_cache.get(
    [
        "GB00B1XFGM25",
        "GB00B4TZHH95",
        "GB00B8JYLC77",
        "GB00B39RMM81",
        "GB00B80QG615",
        "GB00B99C0657",
        # "GB00BH57C751",
        "GB0006061963",
        # "IE00B4WL8048",
        "IE00B90P3080",
        "LU0827884411",
    ]
)
funds_lookup = {fund.isin: fund for fund in funds}

merged_historic_prices = merge_funds_historic_prices(funds)
daily_returns = merged_historic_prices.pct_change()
fees_df = calc_fees(funds)

rising = daily_returns.gt(0)
# prices_falling = daily_returns.lt(0)
# global_prices_diff = merged_historic_prices.rolling(2).mean().diff()
# smoothed_prices = merged_historic_prices.rolling(2).mean()
# global_gradient = smoothed_prices.pct_change()
# global_convexity = global_gradient.diff()

upper_band, middle_band, lower_band = bollinger_bands(merged_historic_prices, stdev=1)
middle_band_grad = middle_band.pct_change()
middle_band_convexity = middle_band_grad.diff()
middle_band_falling = middle_band_convexity.lt(0)

slow_upper_band, slow_middle_band, slow_lower_band = bollinger_bands(merged_historic_prices, timeperiod=60, stdev=1)
slow_middle_band_rising = slow_middle_band.pct_change().gt(0)


# sr = support_resistance(merged_historic_prices)
# support = merged_historic_prices[sr.eq(1)]
# resistance = merged_historic_prices[sr.eq(-1)]

# var = variance(merged_historic_prices)
# q3 = var.quantile(0.75)
# not_high_variance = var.index[var < q3]

# stabilities = stability(merged_historic_prices)
# q1 = stabilities.quantile(0.25)
# not_low_stabilities = stabilities.index[stabilities > q1]

# rsis = merged_historic_prices.apply(talib.RSI)
# low_rsis = rsis.lt(25)
#
# momentums = momentum(merged_historic_prices, 25)
# low_momentums = momentums.lt(-0.05)
# momentum_signs = momentums.ge(0)
# momentum_grad_signs = momentums.diff().ge(0)


# negative_counts = (global_gradient < 0).sum(axis=1)


def simulate_run(start_date: date):
    account = pd.DataFrame([[100, "", ""]], index=[start_date], columns=["value", "isin", "name"])

    def restrict_isins(prices_df: pd.DataFrame, dt: datetime) -> List[str]:
        # def require_positive_returns() -> List[str]:
        #     periods = [pd.DateOffset(months=n) for n in (3, 2, 1)] \
        #               + [pd.DateOffset(weeks=n) for n in (2, 1)]
        #     returns = pd.concat([calc_returns(prices_df, dt, duration, fees_df) for duration in periods], axis=1)
        #     positive_returns_indices = (returns > 0).all(axis=1)
        #     isins = returns.index[positive_returns_indices]
        #     return isins

        def avoid_downtrend() -> List[str]:
            # period = pd.tseries.offsets.BusinessDay(n=1)
            # falling = (prices_falling[dt - period: dt]).all(axis=0)
            middle_not_falling = middle_band_falling.columns[~middle_band_falling.loc[dt, :]]
            # non_falling_isins = falling.index[~falling]
            # non_middle_falling_isins = middle_falling.index[~middle_falling]
            # return set.intersection(
            #     set(non_falling_isins),
            #     set(non_middle_falling_isins)
            # )
            return middle_not_falling

        def avoid_negatives() -> List[str]:
            period = pd.DateOffset(weeks=2)
            # fraction = 0.9
            # section = negative_counts[dt - period: dt]
            # total_funds_at_dt = prices_df.loc[dt].count()
            # threshold = fraction * total_funds_at_dt
            # if len(section[section >= threshold]) >= 1:
            #     return []
            if daily_returns.loc[dt, :].median() < 0:
                return []
            return prices_df.columns

        def avoid_bollinger_top() -> List[str]:
            prices_series = prices_df.loc[dt, :]
            lower_band_series = lower_band.loc[dt, :]
            isins = prices_series[prices_series <= lower_band_series].index
            return isins

        def avoid_bollinger_top_t_1() -> List[str]:
            ytd = dt - BDAY
            ytd_prices_series = prices_df.loc[ytd, :]
            ytd_lower_band_series = lower_band.loc[ytd, :]
            ytd_isins = ytd_prices_series[ytd_prices_series <= ytd_lower_band_series].index

            up = rising.loc[dt, :]
            isins = up.index[up]
            return ytd_isins.intersection(isins)

        def slow_bb_rising() -> List[str]:
            up = slow_middle_band_rising.loc[dt, :]
            isins = up.index[up]
            return isins

        def only_low_rsi() -> List[str]:
            ytd = dt - BDAY
            ytd_low = low_rsis.loc[ytd, :]
            return ytd_low.index[ytd_low]

        def avoid_resistance() -> List[str]:
            offset = pd.DateOffset(months=6)
            legrooms = (resistance[dt - offset:dt] - merged_historic_prices.loc[dt, :]) \
                .clip(lower=0).replace(0, np.nan).min(axis=0)
            legrooms_pct = legrooms / merged_historic_prices.loc[dt, :]
            return legrooms_pct[legrooms_pct > 0.01].index

        def avoid_high_variance() -> List[str]:
            return not_high_variance

        def avoid_low_stability() -> List[str]:
            return not_low_stabilities

        def mom_cross_up() -> List[str]:
            period = 2 * BDAY
            ytd_mts = (~momentum_signs.loc[dt - period:dt - BDAY, :]).all(axis=0)
            ytd_isins = ytd_mts.index[ytd_mts]
            mts = momentum_signs.loc[dt, :]
            isins = mts.index[mts]
            return ytd_isins.intersection(isins)

        def mom_btm() -> List[str]:
            period = 2 * BDAY
            low_mts = low_momentums.loc[dt, :]
            low_isins = low_mts.index[low_mts]
            ytd_mgs = momentum_grad_signs.loc[dt - period - BDAY, :]
            ytd_isins = ytd_mgs.index[~ytd_mgs]
            mgs = momentum_grad_signs.loc[dt - period: dt, :].all(axis=0)
            isins = mgs.index[mgs]
            return set.intersection(
                set(low_isins),
                set(ytd_isins),
                set(isins)
            )

        # def faster_than_bollinger() -> List[str]:
        #     middle_band_series = middle_band.loc[dt, :]
        #     lower_band_series = lower_band.loc[dt, :]
        #     global_prices_diff_series = global_prices_diff.loc[dt, :]
        #     isins = (global_prices_diff_series.clip(lower=0).replace(0, -np.inf) - (
        #             middle_band_series - lower_band_series).clip(lower=0).replace(0,
        #                                                                           np.inf)).nlargest(50).index
        #     return isins

        # funcs = [avoid_bollinger_top]
        funcs = [avoid_bollinger_top_t_1]
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

        def max_momentum() -> List[str]:
            max_isins = momentums.loc[dt, isins].nlargest(NUM_PORTFOLIO).index
            print(f"Dt: {dt} {max_isins} Past mom: {momentums.loc[dt, isins].mean()}")
            return max_isins

        isins = max_6m_returns()
        # return isins if len(isins) == NUM_PORTFOLIO else []
        return isins

    dt = start_date
    while dt < end_date:
        trunc_date = dt - BDAY
        allowed_isins = restrict_isins(merged_historic_prices, trunc_date)
        max_isins = tiebreak_isins(allowed_isins, trunc_date)

        # curr_hold_interval = hold_interval
        curr_hold_interval = calc_hold_interval(merged_historic_prices, dt, max_isins, hold_interval)

        if len(max_isins):
            next_dt = (dt + curr_hold_interval).date()
            max_funds = [funds_lookup[max_isin] for max_isin in max_isins]
            max_names = [f.name for f in max_funds]

            next_1m_return = calc_returns(merge_funds_historic_prices(max_funds), next_dt, curr_hold_interval,
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
