import falcon


class HealthcheckRoutes:
    def on_get(self, req: falcon.Request, resp: falcon.Response):
        resp.body = "OK"

    def on_post(self, req: falcon.Request, resp: falcon.Response):
        resp.body = "OK"


healthcheck_routes = HealthcheckRoutes()
