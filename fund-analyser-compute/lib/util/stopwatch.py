import time


class Stopwatch:
    def __init__(self, start=True):
        self._cum_time = 0
        self._last_pause_timestamp = 0
        self._paused = True

        if start:
            self.start()

    def start(self) -> None:
        self.resume()

    def split(self) -> str:
        if not self._paused:
            self._increment()
        return self._format_duration(self._cum_time)

    def pause(self) -> None:
        assert not self._paused
        self._paused = True
        self._increment()

    def resume(self) -> None:
        assert self._paused
        self._paused = False
        now = time.perf_counter()
        self._last_pause_timestamp = now

    def end(self):
        return self.split()

    def _increment(self):
        now = time.perf_counter()
        self._cum_time += (now - self._last_pause_timestamp)
        self._last_pause_timestamp = now

    def _format_duration(self, seconds: int) -> str:
        return f"{seconds} s"
