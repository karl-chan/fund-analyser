import logging

import falcon
from waitress import serve

from lib.fund import fund_cache
from lib.util import properties
from server.middleware.logging import LoggingMiddleware
from server.routes.admin_routes import healthcheck_routes
from server.routes.indicators_routes import indicators_routes
from server.routes.predict_routes import predict_routes
from server.routes.simulate_routes import simulate_routes

app = falcon.API(middleware=[LoggingMiddleware()])

app.add_route("/admin/healthcheck", healthcheck_routes)
app.add_route("/indicators", indicators_routes)
app.add_route("/predict", predict_routes)
app.add_route("/simulate", simulate_routes)


def init():
    logging.basicConfig(
        level=str(properties.get("log.level")).upper(),
        format="%(message)s")
    fund_cache.maybe_initialise()  # eagerly warm up cache


if __name__ == "__main__":
    init()
    serve(app, port=properties.get("server.default.port"))
