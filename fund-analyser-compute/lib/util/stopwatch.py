import time


class Stopwatch:
    def __init__(self):
        self.start()

    def start(self):
        now = time.perf_counter()
        self._start_time = now
        self._split_time = now

    def split(self):
        now = time.perf_counter()
        elapsed = now - self._split_time
        return self._format_duration(elapsed)

    def end(self):
        now = time.perf_counter()
        elapsed_since_start = now - self._start_time
        self._start_time = None
        self._split_time = None
        return self._format_duration(elapsed_since_start)

    def _format_duration(self, seconds: int) -> str:
        return f"{seconds} s"
