import falcon

from lib.indicators.indicators import get_all_indicators
from lib.util.pandas import pd_historic_prices_from_json


class Indicators:
    def on_get(self, req: falcon.Request, resp: falcon.Response):
        resp.media = {
            indicator.get_key(): {
                "name": indicator.get_display_name(),
                "format": indicator.get_display_format().value,
            } for indicator in get_all_indicators()
        }

    def on_post(self, req: falcon.Request, resp: falcon.Response):
        historic_prices = pd_historic_prices_from_json(req.media)
        resp.media = {indicator.get_key(): indicator.calc(historic_prices).as_dict() for indicator in
                      get_all_indicators()}


indicators_route = Indicators()
