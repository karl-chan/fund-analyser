from datetime import date, datetime
from typing import Iterable, List, Optional

import pandas as pd
import pytest
from overrides import overrides
from pandas._testing import assert_frame_equal

from lib.fund import fund_cache
from lib.fund.fund import Fund
from lib.simulate.simulator import Simulator
from lib.simulate.strategy.strategy import Strategy
from lib.simulate.tiebreaker.no_op_tie_breaker import NoOpTieBreaker
from lib.util.dates import BDAY


@pytest.fixture(autouse=True)
def run_around_tests(monkeypatch):
    monkeypatch.setattr(fund_cache, "get", mock_fundcache_get)
    monkeypatch.setattr(fund_cache, "get_prices", mock_fundcache_get_prices)
    yield


def test_run():
    class TestStrategy(Strategy):
        @overrides
        def run(self, dt: date, prices_df: pd.DataFrame, fees_df: pd.DataFrame) -> List[str]:
            if dt == date(2001, 1, 1):  # 1st BDAY
                return ["isin1", "isin2"]
            if dt == date(2001, 1, 4):  # 4th BDAY
                return ["isin1"]
            if dt == date(2001, 1, 9):  # 7th BDAY
                return []
            if dt == date(2001, 1, 10):  # 8th BDAY
                return ["isin2"]

        @overrides
        def on_data_ready(self, data: Simulator.Data) -> None:
            pass

    simulator = Simulator(
        strategy=TestStrategy(),
        tie_breaker=NoOpTieBreaker(),
        num_portfolio=2,
        hold_interval=2 * BDAY,
        buy_sell_gap=BDAY
    )
    [result] = simulator.run(start_date=date(2001, 1, 1), end_date=date(2001, 1, 12))

    # Does not factor in platform fees, check_less_precise later
    expected_account = pd.DataFrame(
        data=[
            [100, "", ""],
            [100 * (0.5 * (14 / 12) + 0.5 * (24 / 22)), ["isin1", "isin2"], ["Fund 1", "Fund 2"]],
            [100 * (0.5 * (14 / 12) + 0.5 * (24 / 22)) * (17 / 15), ["isin1"], ["Fund 1"]],
            [100 * (0.5 * (14 / 12) + 0.5 * (24 / 22)) * (17 / 15), None, None],
            [100 * (0.5 * (14 / 12) + 0.5 * (24 / 22)) * (17 / 15) * (30 / 29), ["isin2"], ["Fund 2"]]
        ],
        index=[
            date(2001, 1, 1),
            date(2001, 1, 4),
            date(2001, 1, 9),
            date(2001, 1, 11),
            date(2001, 1, 12)
        ],
        columns=["value", "isins", "names"]
    )

    assert_frame_equal(result.account, expected_account, check_less_precise=True)
    assert result.returns == 0.32330550475798586
    assert result.annual_returns == 10955.427133719217
    assert result.max_drawdown == -1.3864736012392243e-05
    assert result.sharpe_ratio == 12.37846848338121
    assert result.start_date == date(2001, 1, 1)
    assert result.end_date == date(2001, 1, 12)


def mock_fundcache_get(isins: Optional[Iterable[str]] = None) -> List[Fund]:
    funds = [
        Fund(
            isin="isin1",
            sedol=None,
            name="Fund 1",
            type=None,
            shareClass=None,
            frequency=None,
            ocf=0,
            amc=0,
            entryCharge=0,
            exitCharge=0,
            bidAskSpread=0,
            holdings=None,
            returns=None,
            asof=None,
            indicators=None,
            realTimeDetails=None
        ),
        Fund(
            isin="isin2",
            sedol=None,
            name="Fund 2",
            type=None,
            shareClass=None,
            frequency=None,
            ocf=0,
            amc=0,
            entryCharge=0,
            exitCharge=0,
            bidAskSpread=0,
            holdings=None,
            returns=None,
            asof=None,
            indicators=None,
            realTimeDetails=None
        )
    ]
    if isins is not None:
        return [fund for fund in funds if fund.isin in isins]
    else:
        return funds


def mock_fundcache_get_prices(isins: Optional[Iterable[str]] = None) -> pd.DataFrame:
    prices_df = pd.DataFrame(
        data=[
            [11, 21],
            [12, 22],
            [13, 23],
            [14, 24],
            [15, 25],
            [16, 26],
            [17, 27],
            [18, 28],
            [19, 29],
            [20, 30]
        ],
        index=pd.date_range(datetime(2001, 1, 1), datetime(2001, 1, 12), freq="B"),
        columns=["isin1", "isin2"]
    )
    return prices_df[isins] if isins is not None else prices_df
