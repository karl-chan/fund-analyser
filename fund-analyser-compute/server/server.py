import logging

import falcon
from waitress import serve

from lib.util import properties
from server.middleware.logging import LoggingMiddleware
from server.routes.admin import healthcheck_route
from server.routes.indicators import indicators_route

logging.basicConfig(
    level=str(properties.get("log.level")).upper(),
    format="%(message)s")

app = falcon.API(middleware=[LoggingMiddleware()])

app.add_route("/admin/healthcheck", healthcheck_route)
app.add_route("/indicators", indicators_route)

if __name__ == "__main__":
    serve(app, port=properties.get("server.default.port"))
