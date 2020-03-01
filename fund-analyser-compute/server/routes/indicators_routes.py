from __future__ import annotations

from typing import Dict, NamedTuple

import falcon

from lib.fund.fund import Fund, FundHistoricPrices
from lib.indicators.indicators import get_all_indicators
from lib.util.pandas import pd_historic_prices_from_json


class IndicatorsRoutes:
    class IndicatorParam(NamedTuple):
        fund: Fund
        historic_prices: FundHistoricPrices

        @classmethod
        def from_dict(cls, d: Dict) -> IndicatorsRoutes.IndicatorParam:
            return IndicatorsRoutes.IndicatorParam(
                fund=Fund.from_dict(d.get("fund")),
                historic_prices=pd_historic_prices_from_json(d.get("historicPrices"))
            )

    def on_get(self, req: falcon.Request, resp: falcon.Response):
        resp.media = {
            indicator.get_key(): {
                "name": indicator.get_display_name(),
                "format": indicator.get_display_format().value,
            } for indicator in get_all_indicators()
        }

    def on_post(self, req: falcon.Request, resp: falcon.Response):
        param = IndicatorsRoutes.IndicatorParam.from_dict(req.media)
        resp.media = {
            indicator.get_key(): indicator.calc(
                fund=param.fund,
                historic_prices=param.historic_prices
            ).as_dict()
            for indicator in get_all_indicators()}


indicators_routes = IndicatorsRoutes()
