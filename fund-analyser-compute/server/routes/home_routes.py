import falcon


class HomeRoutes:
    def on_get(self, req: falcon.Request, resp: falcon.Response):
        resp.body = "OK"

    def on_post(self, req: falcon.Request, resp: falcon.Response):
        resp.body = "OK"


home_routes = HomeRoutes()
