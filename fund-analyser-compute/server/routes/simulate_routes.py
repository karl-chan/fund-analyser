from __future__ import annotations

from datetime import date
from typing import Dict, List, NamedTuple, Optional

import falcon

from lib.simulate.simulator import Simulator
from lib.simulate.strategy import strategies
from lib.simulate.strategy.strategies import get_all_strategies
from lib.simulate.strategy.strategy import Strategy
from lib.util.dates import format_date, parse_date, BDAY
from server.model.account_statement import AccountStatement


class SimulateRoutes:
    class SimulateParam(NamedTuple):
        strategy: Strategy
        isins: Optional[List[str]]
        num_portfolio: int

        @classmethod
        def from_dict(cls, d: Dict) -> SimulateRoutes.SimulateParam:
            return SimulateRoutes.SimulateParam(
                strategy=cls._parse_strategy(d.get("strategy")),
                isins=d.get("isins"),
                num_portfolio=d.get("numPortfolio")
            )

        @classmethod
        def _parse_strategy(cls, strategy_str: Optional[str]) -> Strategy:
            if not strategy_str:
                raise falcon.HTTPMissingParam("strategy")
            strategy = strategies.from_name(strategy_str)
            if not strategy:
                raise falcon.HTTPInvalidParam(
                    f"strategy must be one of: {', '.join(get_all_strategies().keys())}",
                    "strategy")
            return strategy

    class SimulateResponse(NamedTuple):
        result: Simulator.Result

        def as_dict(self) -> Dict:
            return {
                "statement": AccountStatement.from_account(self.result.account).as_dict(),
                "returns": self.result.returns,
                "maxDrawdown": self.result.max_drawdown,
                "sharpeRatio": self.result.sharpe_ratio,
                "startDate": format_date(self.result.start_date),
                "endDate": format_date(self.result.end_date)
            }

    def on_post(self, req: falcon.Request, resp: falcon.Response):
        param = SimulateRoutes.SimulateParam.from_dict(req.media)
        simulator = self._build_simulator(param)
        result = simulator.run()
        resp.media = SimulateRoutes.SimulateResponse(result=result).as_dict()

    class PredictParam(NamedTuple):
        simulate_param: SimulateRoutes.SimulateParam
        date: Optional[date]

        @classmethod
        def from_dict(cls, d: Dict) -> SimulateRoutes.PredictParam:
            return SimulateRoutes.PredictParam(
                simulate_param=cls._parse_simulate_param(d.get("simulateParam")),
                date=cls._parse_date(d.get("date"))
            )

        @classmethod
        def _parse_simulate_param(cls, d: Optional[Dict]) -> SimulateRoutes.SimulateParam:
            if not d:
                raise falcon.HTTPMissingParam("simulateParams")
            return SimulateRoutes.SimulateParam.from_dict(d)

        @classmethod
        def _parse_date(cls, date_str: Optional[str]) -> Optional[date]:
            return parse_date(date_str).date() if date_str else None

    def on_post_predict(self, req: falcon.Request, resp: falcon.Response):
        params = SimulateRoutes.PredictParam.from_dict(req.media)
        predict_date = BDAY.rollback(params.date) if params.date else None
        simulator = self._build_simulator(params.simulate_param)
        result = simulator.predict(predict_date)
        resp.media = {
            "date": format_date(result.date),
            "funds": [
                {
                    "isin": fund.isin,
                    "name": fund.name
                }
                for fund in result.funds
            ]
        }

    def on_get_strategies(self, req: falcon.Request, resp: falcon.Response):
        resp.media = list(get_all_strategies().keys())

    @classmethod
    def _build_simulator(cls, params: SimulateRoutes.SimulateParam) -> Simulator:
        return Simulator(
            strategy=params.strategy,
            isins=params.isins,
            num_portfolio=params.num_portfolio)


simulate_routes = SimulateRoutes()
