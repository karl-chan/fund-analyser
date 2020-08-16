import time

from lib.util.stopwatch import Stopwatch


def test_stopwatch():
    timer = Stopwatch()

    time.sleep(0.1)
    assert timer.split().startswith("0.10")

    timer.pause()
    assert timer.split().startswith("0.10")

    time.sleep(0.1)
    assert timer.split().startswith("0.10")

    timer.resume()
    assert timer.split().startswith("0.10")

    time.sleep(0.1)
    assert timer.end().startswith("0.20")
