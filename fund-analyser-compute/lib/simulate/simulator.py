from __future__ import annotations

import logging
import sys
from datetime import date
from typing import Iterable, List, NamedTuple, Optional

import matplotlib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from ffn import calc_max_drawdown

from lib.fund import fund_cache
from lib.fund.fund import Fund
from lib.fund.fund_utils import calc_fees, calc_returns, calc_sharpe_ratio, DAILY_PLATFORM_FEES
from lib.simulate.strategy.strategy import Strategy
from lib.simulate.tiebreaker.tie_breaker import TieBreaker
from lib.util.dates import BDAY

logging.basicConfig(level=logging.DEBUG)
pd.set_option('display.max_colwidth', 1000)


class Simulator:
    class Data(NamedTuple):
        prices_df: pd.DataFrame
        fees_df: pd.DataFrame
        num_portfolio: int
        hold_interval: pd.DateOffset

    class Prediction(NamedTuple):
        date: date
        funds: List[Fund]

    class Result(NamedTuple):
        account: pd.DataFrame
        returns: float
        annual_returns: float
        max_drawdown: float
        sharpe_ratio: float
        start_date: date
        end_date: date

    DEFAULT_NUM_PORTFOLIO = 1
    DEFAULT_HOLD_INTERVAL = 5 * BDAY
    DEFAULT_BUY_SELL_GAP = BDAY

    def __init__(self,
                 strategy: Strategy,
                 tie_breaker: Optional[TieBreaker] = None,
                 isins: Optional[Iterable[str]] = None,
                 num_portfolio: Optional[int] = None,
                 hold_interval=None,
                 buy_sell_gap=None):

        # apply default values
        if tie_breaker is None:
            from lib.simulate.tiebreaker.max_returns_tie_breaker import MaxReturnsTieBreaker
            tie_breaker = MaxReturnsTieBreaker()
        num_portfolio = num_portfolio or self.DEFAULT_NUM_PORTFOLIO
        hold_interval = hold_interval or self.DEFAULT_HOLD_INTERVAL
        buy_sell_gap = buy_sell_gap or self.DEFAULT_BUY_SELL_GAP

        funds = fund_cache.get(isins)

        self._strategy = strategy
        self._tie_breaker = tie_breaker

        self._num_portfolio = num_portfolio
        self._hold_interval = hold_interval
        self._buy_sell_gap = buy_sell_gap

        # computed properties
        self._prices_df = fund_cache.get_prices(isins)
        self._fees_df = calc_fees(funds)
        self._last_valid_date = self._prices_df.last_valid_index().date()

        self._broadcast_data(Simulator.Data(
            prices_df=self._prices_df,
            fees_df=self._fees_df,
            num_portfolio=self._num_portfolio,
            hold_interval=self._hold_interval
        ))

    def _broadcast_data(self, data: Simulator.Data) -> None:
        self._strategy.on_data_ready(data)
        self._tie_breaker.on_data_ready(data)

    def run(self,
            start_date: date = (date.today() - pd.DateOffset(years=5)).date(),
            end_date: date = date.today(),
            multi: bool = False) -> List[Simulator.Result]:
        """
        Runs simulation between a pair of dates.
        :param start_date:
        :param end_date:
        :param multi: If true, run for start dates between
                      [start_date, start_date + hold_interval).
                      If false, run one off simulation.
        :return:
        """
        if multi:
            return self._run_multi(start_date, end_date)
        else:
            return [self._run_single(start_date, end_date)]

    def _run_single(self, start_date: date, end_date: date) -> Simulator.Result:
        account = pd.DataFrame(data=[[100, "", ""]],
                               index=[start_date],
                               columns=["value", "isins", "names"])

        # jump start to first data point if not available
        dt = max(start_date, self._prices_df.first_valid_index() + self._buy_sell_gap)

        while dt < end_date:
            trunc_date = dt - self._buy_sell_gap
            prediction = self.predict(trunc_date)
            max_funds = prediction.funds
            max_isins = [fund.isin for fund in max_funds]

            curr_hold_interval = self._hold_interval
            # curr_hold_interval = calc_hold_interval(self._prices_df, dt, max_isins, self._hold_interval)

            if len(max_funds):
                next_dt = (dt + curr_hold_interval).date()
                max_names = [f.name for f in max_funds]

                next_return = calc_returns(self._prices_df[max_isins],
                                           next_dt,
                                           curr_hold_interval,
                                           self._fees_df).mean()
                account.loc[next_dt, :] = [account.iloc[-1, :]["value"] * (1 + next_return),
                                           max_isins,
                                           max_names]
                dt = (next_dt + self._buy_sell_gap).date()
            else:
                next_dt = (dt + BDAY).date()
                # carry forward
                account.loc[next_dt, :] = [account.iloc[-1, :]["value"] * (1 - DAILY_PLATFORM_FEES), None, None]
                dt = next_dt

        account.rename(index={next_dt: min(next_dt, end_date)}, inplace=True)  # clip end date if out of bounds
        total_returns = (account.iloc[-1, :].loc["value"] - account.iloc[0, :].loc["value"]) \
                        / account.iloc[0, :].loc["value"]
        annual_returns = (1 + total_returns) ** (365.25 / (end_date - start_date).days) - 1
        print(account.to_string())

        return Simulator.Result(
            account=account,
            returns=total_returns,
            annual_returns=annual_returns,
            max_drawdown=calc_max_drawdown(account["value"]),
            sharpe_ratio=calc_sharpe_ratio(account["value"]),
            start_date=start_date,
            end_date=end_date
        )

    def _run_multi(self, start_date: date, end_date: date) -> List[Simulator.Result]:
        return [
            self._run_single(start_date=cycle_start_timestamp.date(),
                             end_date=end_date)
            for cycle_start_timestamp
            in pd.date_range(start=start_date,
                             end=start_date + self._hold_interval,
                             freq=BDAY)
        ]

    def predict(self, dt: Optional[date] = None) -> Prediction:
        """
        Generates prediction at given date, or the last valid date if not supplied.
        :param dt: Date of prediction. Defaults to last valid date.
        :return:
        """
        if not dt:
            dt = self._last_valid_date
        allowed_isins = self._strategy.run(dt, self._prices_df, self._fees_df)
        max_isins = self._tie_breaker.run(allowed_isins,
                                          self._num_portfolio,
                                          dt,
                                          self._prices_df,
                                          self._fees_df)
        return Simulator.Prediction(date=dt, funds=fund_cache.get(max_isins))

    @classmethod
    def describe_and_plot(cls, results: Iterable[Simulator.Result]) -> None:
        holding_returns = pd.concat(
            [r.account["value"].pct_change().replace(0, np.nan).dropna() for r in results],
            axis=0)
        print(f"Holding returns distribution:\n{holding_returns.describe()}")

        sorted_by_returns = sorted(results, key=lambda r: r.returns)
        min_returns, max_returns = sorted_by_returns[0], sorted_by_returns[-1]
        print(
            f"Min returns: {min_returns.returns} (annual: {min_returns.annual_returns}) Begin date: {min_returns.start_date}")
        print(
            f"Max returns: {max_returns.returns} (annual: {max_returns.annual_returns}) Begin date: {max_returns.start_date}")

        sorted_by_drawdowns = sorted(results, key=lambda r: r.max_drawdown)
        max_drawdown = sorted_by_drawdowns[0]
        print(f"Max drawdown: {max_drawdown.max_drawdown} Begin date: {max_drawdown.start_date}")

        sorted_by_sharpe_ratios = sorted(results, key=lambda r: r.sharpe_ratio)
        min_sharpe_ratio = sorted_by_sharpe_ratios[0]
        print(f"Min sharpe ratio: {min_sharpe_ratio.sharpe_ratio} Begin date: {min_sharpe_ratio.start_date}")

        # set display mode and suppress useless warnings
        matplotlib.use("Qt5Agg" if sys.platform == "darwin" else "TkAgg", warn=False)
        logging.getLogger("matplotlib.font_manager").setLevel(logging.INFO)

        # total returns histogram
        returns_hist = pd.DataFrame([r.returns for r in sorted_by_returns],
                                    index=[r.start_date for r in sorted_by_returns])
        returns_hist.plot(kind="hist", title="Total returns distribution")
        plt.figure()

        # holding returns histogram
        holding_returns.plot(kind="hist", title="Holding returns distribution", bins=100)
        plt.figure()

        # account line series
        min_returns.account.loc[:, ["value"]].plot(title=f"Min returns series. Begin date: {min_returns.start_date}")
        max_returns.account.loc[:, ["value"]].plot(title=f"Max returns series. Begin date: {max_returns.start_date}")
        plt.show()
