from __future__ import annotations

from typing import Dict, NamedTuple

import falcon

from lib.fund.fund import Fund, FundHistoricPrices
from lib.indicators.indicators import get_all_fund_indicators, get_all_stock_indicators
from lib.stock.stock import Stock, StockHistoricPrices
from lib.util.pandas_utils import pd_historic_prices_from_json


class IndicatorsRoutes:
    class FundIndicatorParam(NamedTuple):
        fund: Fund
        historic_prices: FundHistoricPrices

        @classmethod
        def from_dict(cls, d: Dict) -> IndicatorsRoutes.FundIndicatorParam:
            return IndicatorsRoutes.FundIndicatorParam(
                fund=Fund.from_dict(d.get("fund")),  # type: ignore
                historic_prices=pd_historic_prices_from_json(d.get("historicPrices"))  # type: ignore
            )

    def on_get_fund(self, req: falcon.Request, resp: falcon.Response):
        resp.media = {
            indicator.get_key(): {
                "name": indicator.get_display_name(),
                "format": indicator.get_display_format().value,
            } for indicator in get_all_fund_indicators(None)  # type: ignore
        }

    def on_post_fund(self, req: falcon.Request, resp: falcon.Response):
        param = IndicatorsRoutes.FundIndicatorParam.from_dict(req.media)
        resp.media = {
            indicator.get_key(): indicator.calc(historic_prices=param.historic_prices).as_dict()
            for indicator in get_all_fund_indicators(param.fund)}

    class StockIndicatorParam(NamedTuple):
        stock: Stock
        historic_prices: StockHistoricPrices

        @classmethod
        def from_dict(cls, d: Dict) -> IndicatorsRoutes.StockIndicatorParam:
            return IndicatorsRoutes.StockIndicatorParam(
                stock=Stock.from_dict(d.get("stock")),  # type: ignore
                historic_prices=pd_historic_prices_from_json(d.get("historicPrices"))  # type: ignore
            )

    def on_get_stock(self, req: falcon.Request, resp: falcon.Response):
        resp.media = {
            indicator.get_key(): {
                "name": indicator.get_display_name(),
                "format": indicator.get_display_format().value,
            } for indicator in get_all_stock_indicators()
        }

    def on_post_stock(self, req: falcon.Request, resp: falcon.Response):
        param = IndicatorsRoutes.StockIndicatorParam.from_dict(req.media)
        resp.media = {
            indicator.get_key(): indicator.calc(historic_prices=param.historic_prices["price"]).as_dict()
            for indicator in get_all_stock_indicators()}


indicators_routes = IndicatorsRoutes()
