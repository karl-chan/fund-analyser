from typing import NamedTuple, Optional, List, Dict

import falcon
import pandas as pd

from lib.simulate.simulator import Simulator
from lib.simulate.strategy.strategies import get_all_strategies
from lib.simulate.strategy.strategy import Strategy
from lib.util.date import format_date


class SimulateRoutes:
    class RequestParams(NamedTuple):
        strategy: Strategy
        isins: List[str]
        num_portfolio: int

    def __init__(self) -> None:
        self._default_strategy = None
        self._default_isins = None
        self._default_num_portfolio = 1

    def on_get(self, req: falcon.Request, resp: falcon.Response):
        params = self._parse_params(req)
        simulator = Simulator(strategy=params.strategy, isins=params.isins, num_portfolio=params.num_portfolio)
        result = simulator.run()
        resp.media = {
            "account": self._account_as_list(result.account),
            "returns": result.returns,
            "drawdown": result.drawdown,
            "sharpe_ratio": result.sharpe_ratio,
            "start_date": format_date(result.start_date),
            "end_date": format_date(result.end_date)
        }

    def _parse_params(self, req: falcon.Request) -> RequestParams:
        def _parse_strategy(req: falcon.Request) -> Optional[Strategy]:
            strategy_name = req.get_param("strategy")
            if not strategy_name:
                raise falcon.HTTPMissingParam("strategy")
            if not strategy_name in get_all_strategies():
                raise falcon.HTTPInvalidParam(
                    f"strategy must be one of: {', '.join(get_all_strategies().keys())}",
                    "strategy")
            return get_all_strategies()[strategy_name]

        def _parse_isins(req: falcon.Request) -> Optional[List[str]]:
            isins_str = req.get_param("isins")
            return isins_str.split(",") if isins_str else None

        def _parse_num_portfolio(req: falcon.Request) -> Optional[int]:
            num_portfolio_str = req.get_param("num_portfolio")
            return int(num_portfolio_str) if num_portfolio_str else None

        return SimulateRoutes.RequestParams(
            strategy=_parse_strategy(req),
            isins=_parse_isins(req) or self._default_isins,
            num_portfolio=_parse_num_portfolio(req) or self._default_num_portfolio
        )

    def _account_as_list(self, account: pd.DataFrame) -> List[Dict[str, any]]:
        account = account.copy(deep=False)
        account.insert(loc=0, column="date", value=account.index.map(format_date))
        return account.to_dict(orient="records")


simulate_routes = SimulateRoutes()
