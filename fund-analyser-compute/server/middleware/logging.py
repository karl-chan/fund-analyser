import logging
from datetime import datetime

import falcon


class LoggingMiddleware:

    def process_request(self, req: falcon.Request, resp: falcon.Response):
        req.context["start_time"] = datetime.now()

    def process_response(self, req: falcon.Request, resp: falcon.Response, resource, req_succeeded: bool):
        time_taken_ms = int((datetime.now() - req.context["start_time"]).total_seconds() * 1000)
        logging.info(f"  --> {req.method} {req.relative_uri} {resp.status[:3]} {time_taken_ms}ms -")
