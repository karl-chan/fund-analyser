from datetime import date
from typing import NamedTuple, Optional, List

import falcon

from lib.fund import fund_cache
from lib.simulate.simulator import Simulator
from lib.simulate.strategy import bollinger_returns
from lib.simulate.strategy.bollinger_returns import BollingerReturns
from lib.simulate.strategy.strategies import get_all_strategies
from lib.simulate.strategy.strategy import Strategy
from lib.util.date import parse_date, format_date


class PredictRoutes:
    class RequestParams(NamedTuple):
        strategy: Strategy
        date: date
        isins: List[str]
        num_portfolio: int

    def __init__(self) -> None:
        self._default_strategy = BollingerReturns()
        self._default_date = fund_cache.get_prices().last_valid_index().date()
        self._default_isins = bollinger_returns.isins
        self._default_num_portfolio = 1

    def on_get(self, req: falcon.Request, resp: falcon.Response):
        params = self._parse_params(req)
        simulator = Simulator(strategy=params.strategy, isins=params.isins, num_portfolio=params.num_portfolio)
        prediction = simulator.predict(params.date)
        resp.media = {
            "date": format_date(params.date),
            "predictions": [fund.isin for fund in prediction.funds]
        }

    def _parse_params(self, req: falcon.Request) -> RequestParams:
        def _parse_strategy(req: falcon.Request) -> Optional[Strategy]:
            return next(
                (s for s in get_all_strategies() if req.get_param("strategy") == s.__class__.__name__),
                None)

        def _parse_date(req: falcon.Request) -> Optional[date]:
            date_str = req.get_param("date")
            return parse_date(date_str).date() if date_str else None

        def _parse_isins(req: falcon.Request) -> Optional[List[str]]:
            isins_str = req.get_param("isins")
            return isins_str.split(",") if isins_str else None

        def _parse_num_portfolio(req: falcon.Request) -> Optional[int]:
            num_portfolio_str = req.get_param("num_portfolio")
            return int(num_portfolio_str) if num_portfolio_str else None

        return PredictRoutes.RequestParams(
            strategy=_parse_strategy(req) or self._default_strategy,
            date=_parse_date(req) or self._default_date,
            isins=_parse_isins(req) or self._default_isins,
            num_portfolio=_parse_num_portfolio(req) or self._default_num_portfolio
        )


predict_routes = PredictRoutes()
