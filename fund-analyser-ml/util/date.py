from dateutil.relativedelta import relativedelta
from pandas.tseries.offsets import *


def to_timedelta(lookback):
    magnitude = int(lookback[:-1])
    unit = lookback[-1]
    if unit == "Y":
        return relativedelta(years=magnitude)
    if unit == "M":
        return relativedelta(months=magnitude)
    if unit == "W":
        return relativedelta(weeks=magnitude)
    if unit == "D":
        return relativedelta(days=magnitude)
    if unit == "B":
        return BDay(magnitude)
    assert False, "Invalid lookback: {}".format(lookback)

def truncate_series_head(series, lookback):
    start_date = series.index[0] + to_timedelta(lookback)
    return series.truncate(start_date)

def truncate_series_tail(series, lookback):
    end_date = series.index[-1] - to_timedelta(lookback)
    return series.truncate(after=end_date)