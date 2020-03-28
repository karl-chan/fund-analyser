import numpy as np
import pandas as pd
import pytest

from lib.indicators.ppo import PPO
from lib.util.pandas_utils import pd_historic_prices_from_json

SAMPLE_HISTORIC_PRICES = pd_historic_prices_from_json([
    {"date": "2017-03-10T00:00:00Z", "price": 486.0},
    {"date": "2017-03-11T00:00:00Z", "price": 486.0},
    {"date": "2017-03-12T00:00:00Z", "price": 482.0},
    {"date": "2017-03-13T00:00:00Z", "price": 479.0},
    {"date": "2017-03-18T00:00:00Z", "price": 475.0},
    {"date": "2017-03-19T00:00:00Z", "price": 467.0},
    {"date": "2017-03-20T00:00:00Z", "price": 468.0},
    {"date": "2017-03-21T00:00:00Z", "price": 472.0},
    {"date": "2017-03-24T00:00:00Z", "price": 469.0},
    {"date": "2017-03-25T00:00:00Z", "price": 474.0},
    {"date": "2017-03-26T00:00:00Z", "price": 477.0},
    {"date": "2017-03-27T00:00:00Z", "price": 474.0},
    {"date": "2017-03-28T00:00:00Z", "price": 473.0},
    {"date": "2017-04-02T00:00:00Z", "price": 473.0},
    {"date": "2017-04-03T00:00:00Z", "price": 474.0},
    {"date": "2017-04-04T00:00:00Z", "price": 475.0},
    {"date": "2017-04-05T00:00:00Z", "price": 473.0},
    {"date": "2017-04-08T00:00:00Z", "price": 474.0},
    {"date": "2017-04-09T00:00:00Z", "price": 475.0},
    {"date": "2017-04-10T00:00:00Z", "price": 474.0},
    {"date": "2017-04-11T00:00:00Z", "price": 476.0},
    {"date": "2017-04-12T00:00:00Z", "price": 477.0},
    {"date": "2017-04-15T00:00:00Z", "price": 474.0},
    {"date": "2017-04-16T00:00:00Z", "price": 478.0},
    {"date": "2017-04-17T00:00:00Z", "price": 474.0},
    {"date": "2017-04-18T00:00:00Z", "price": 464.0},
    {"date": "2017-04-19T00:00:00Z", "price": 467.0},
    {"date": "2017-04-22T00:00:00Z", "price": 470.0},
    {"date": "2017-04-23T00:00:00Z", "price": 473.0},
    {"date": "2017-04-24T00:00:00Z", "price": 475.0},
    {"date": "2017-04-25T00:00:00Z", "price": 476.0},
    {"date": "2017-04-26T00:00:00Z", "price": 482.0},
    {"date": "2017-04-30T00:00:00Z", "price": 482.0},
    {"date": "2017-05-01T00:00:00Z", "price": 482.0},
    {"date": "2017-05-02T00:00:00Z", "price": 482.0}
])


def test_ppo_empty_returns_nan():
    assert np.isnan(PPO().calc(fund=None, historic_prices=pd.Series()).value)


def test_ppo_short_returns_nan():
    assert np.isnan(PPO().calc(fund=None, historic_prices=SAMPLE_HISTORIC_PRICES[:10]).value)


def test_ppo():
    actual = PPO().calc(fund=None, historic_prices=SAMPLE_HISTORIC_PRICES)
    assert actual.value == pytest.approx(0.104, rel=0.01)
