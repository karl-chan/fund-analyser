from __future__ import annotations

import logging
from datetime import date
from typing import Iterable, NamedTuple, List

import matplotlib
import matplotlib.pyplot as plt
import pandas as pd
from ffn import calc_max_drawdown

from lib.fund import fund_cache
from lib.fund.fund import Fund
from lib.fund.fund_utils import merge_funds_historic_prices, calc_fees, calc_returns, calc_sharpe_ratio
from lib.simulate.strategy.strategy import Strategy
from lib.simulate.tiebreaker.tie_breaker import TieBreaker
from lib.util.date import BDAY

logging.basicConfig(level=logging.DEBUG)
pd.set_option('display.max_colwidth', 1000)


class Simulator:
    class Data(NamedTuple):
        prices_df: pd.DataFrame
        fees_df: pd.DataFrame
        hold_interval: pd.DateOffset

    class Prediction(NamedTuple):
        funds: List[Fund]

    class Result(NamedTuple):
        account: pd.DataFrame
        returns: float
        drawdown: float
        sharpe_ratio: float
        start_date: date
        end_date: date

    def __init__(self,
                 strategy: Strategy,
                 tie_breaker: TieBreaker = None,
                 isins: Iterable[str] = None,
                 num_portfolio: int = 1,
                 hold_interval=5 * BDAY,
                 buy_sell_gap=BDAY):
        funds = fund_cache.get(isins)

        self._strategy = strategy
        from lib.simulate.tiebreaker.max_returns_tie_breaker import MaxReturnsTieBreaker
        self._tie_breaker = tie_breaker or MaxReturnsTieBreaker()

        self._funds_lookup = {fund.isin: fund for fund in funds}
        self._num_portfolio = num_portfolio
        self._hold_interval = hold_interval
        self._buy_sell_gap = buy_sell_gap

        # computed properties
        self._prices_df = merge_funds_historic_prices(funds)
        self._fees_df = calc_fees(funds)

        self._broadcast_data(Simulator.Data(
            prices_df=self._prices_df,
            fees_df=self._fees_df,
            hold_interval=self._hold_interval
        ))

    def _broadcast_data(self, data: Simulator.Data) -> None:
        self._strategy.on_data_ready(data)
        self._tie_breaker.on_data_ready(data)

    def run(self,
            start_date: date = (date.today() - pd.DateOffset(years=5)).date(),
            end_date: date = date.today()) -> Simulator.Result:
        account = pd.DataFrame(data=[[100, "", ""]],
                               index=[start_date],
                               columns=["value", "isin", "name"])
        dt = start_date

        while dt < end_date:
            trunc_date = dt - self._buy_sell_gap
            prediction = self.predict(trunc_date)
            max_funds = prediction.funds
            max_isins = [f.isin for f in max_funds]

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
                                           ",".join(max_isins),
                                           max_names]
                dt = (next_dt + self._buy_sell_gap).date()
            else:
                next_dt = (dt + BDAY).date()
                # carry forward
                account.loc[next_dt, :] = [account.iloc[-1, :]["value"], None, None]
                dt = next_dt

        print(account.to_string())
        return Simulator.Result(
            account=account,
            returns=(account.iloc[-1, :].loc["value"] - account.iloc[0, :].loc["value"])
                    / account.iloc[0, :].loc["value"],
            drawdown=calc_max_drawdown(account["value"]),
            sharpe_ratio=calc_sharpe_ratio(account["value"]),
            start_date=start_date,
            end_date=end_date
        )

    def predict(self, date: date) -> Prediction:
        allowed_isins = self._strategy.run(date, self._prices_df, self._fees_df)
        max_isins = self._tie_breaker.run(allowed_isins,
                                          self._num_portfolio,
                                          date,
                                          self._prices_df,
                                          self._fees_df)
        return Simulator.Prediction(funds=fund_cache.get(max_isins))

    @staticmethod
    def describe_and_plot(results: Iterable[Simulator.Result]) -> None:
        sorted_by_returns = sorted(results, key=lambda r: r.returns)
        min_returns, max_returns = sorted_by_returns[0], sorted_by_returns[-1]
        print(f"Min returns: {min_returns.returns} Begin date: {min_returns.start_date}")
        print(f"Max returns: {max_returns.returns} Begin date: {max_returns.start_date}")

        sorted_by_drawdowns = sorted(results, key=lambda r: r.drawdown)
        max_drawdown = sorted_by_drawdowns[0]
        print(f"Max drawdown: {max_drawdown.drawdown} Begin date: {max_drawdown.start_date}")

        sorted_by_sharpe_ratios = sorted(results, key=lambda r: r.sharpe_ratio)
        min_sharpe_ratio = sorted_by_sharpe_ratios[0]
        print(f"Min sharpe ratio: {min_sharpe_ratio.sharpe_ratio} Begin date: {min_sharpe_ratio.start_date}")

        # set display mode and suppress useless warnings
        matplotlib.use("tkagg", warn=False)
        logging.getLogger("matplotlib.font_manager").setLevel(logging.INFO)

        # returns histogram
        returns_hist = pd.DataFrame([r.returns for r in sorted_by_returns],
                                    index=[r.start_date for r in sorted_by_returns])
        returns_hist.hist()

        # account line series
        min_returns.account.loc[:, ["value"]].plot()
        max_returns.account.loc[:, ["value"]].plot()
        plt.show()
