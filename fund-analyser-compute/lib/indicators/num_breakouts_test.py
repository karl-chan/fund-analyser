from lib.indicators.num_breakouts import NumBreakouts
from lib.util.pandas_utils import pd_historic_prices_from_json

SAMPLE_HISTORIC_PRICES = pd_historic_prices_from_json([
    {"date": "2017-03-10T00:00:00Z", "price": 486.0},
    {"date": "2017-03-11T00:00:00Z", "price": 486.0},
    {"date": "2017-03-12T00:00:00Z", "price": 482.0},
    {"date": "2017-03-13T00:00:00Z", "price": 489.0},
    {"date": "2017-03-18T00:00:00Z", "price": 475.0},
    {"date": "2017-03-13T00:00:00Z", "price": 489.0},
    {"date": "2017-03-19T00:00:00Z", "price": 487.0},
    {"date": "2017-03-20T00:00:00Z", "price": 490.0}
])


def test_num_breakouts():
    actual = NumBreakouts().calc(historic_prices=SAMPLE_HISTORIC_PRICES)
    assert actual.value == 2
