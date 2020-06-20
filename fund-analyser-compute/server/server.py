import falcon
from waitress import serve

from lib.util import properties
from server.middleware.logging import LoggingMiddleware
from server.routes.home_routes import home_routes
from server.routes.indicators_routes import indicators_routes
from server.routes.simulate_routes import simulate_routes

app = falcon.API(middleware=[LoggingMiddleware()])

app.add_route("/", home_routes)
app.add_route("/indicators/fund", indicators_routes, suffix="fund")
app.add_route("/indicators/stock", indicators_routes, suffix="stock")
app.add_route("/simulate", simulate_routes)
app.add_route("/simulate/predict", simulate_routes, suffix="predict")
app.add_route("/simulate/strategies", simulate_routes, suffix="strategies")

if __name__ == "__main__":
    serve(app, port=properties.get("server.default.port"))
