import pandas as pd
import numpy as np

from util.date import to_timedelta, truncate_series_head, truncate_series_tail

from scipy.stats import percentileofscore, variation

def stats_from_historic_prices(price_series, lookbacks, target):
    # stats = [returns(l, price_series) for l in lookbacks] + [percentiles(l, price_series) for l in lookbacks] \
    #          + [peekahead(target, price_series)]
    stats = [delta_returns(l, "1B", price_series) for l in lookbacks] + [percentiles(l, price_series) for l in lookbacks] + [peekahead(target, price_series)]
    return pd.concat(stats, axis=1, join="inner")

def delta_returns(lookback, delta, price_series):
    print("Calculating delta returns for lookback: {}, delta: {}".format(lookback, delta))

    def calc_return(date, delta, price):
        prev_date = date - to_timedelta(lookback)
        prev_price = price_series.asof(prev_date)
        prev_prev_date = prev_date - to_timedelta(delta)
        prev_prev_price = price_series.asof(prev_prev_date)
        return (prev_price - prev_prev_price) / prev_prev_price
    price_series_tail = truncate_series_head(truncate_series_head(price_series, lookback), delta)
    returns = [calc_return(date, delta, price) for (date, price) in price_series_tail.iteritems()]
    return pd.Series(returns, name="delta_returns.{}".format(lookback), index=price_series_tail.index)


def cum_returns(lookback, price_series):
    print("Calculating cumulative returns for lookback: {}...".format(lookback))

    def calc_return(date, price):
        prev_date = date - to_timedelta(lookback)
        prev_price = price_series.asof(prev_date)
        return (price - prev_price) / prev_price

    price_series_tail = truncate_series_head(price_series, lookback)
    returns = [calc_return(date, price) for (date, price) in price_series_tail.iteritems()]
    return pd.Series(returns, name="cum_returns.{}".format(lookback), index=price_series_tail.index)


def log_returns(lookback, price_series):
    print("Calculating log returns for lookback: {}...".format(lookback))
    return np.log(cum_returns(lookback, price_series))

def percentiles(lookback, price_series):
    print("Calculating percentiles for lookback: {}...".format(lookback))

    def calc_percentile(date, price):
        prev_date = date - to_timedelta(lookback)
        local_price_series = price_series.truncate(prev_date, date)
        return percentileofscore(local_price_series.values, price)/100

    price_series_tail = truncate_series_head(price_series, lookback)
    percentiles = [calc_percentile(date, price) for (date, price) in price_series_tail.iteritems()]
    return pd.Series(percentiles, name="percentiles.{}".format(lookback), index=price_series_tail.index)


def peekahead(lookback, price_series):
    print("Calculating peekahead for lookback: {}...".format(lookback))

    def calc_future_return(date, price):
        future_date = date + to_timedelta(lookback)
        try:
            idx = price_series.index.get_loc(future_date, method="backfill")
            future_price = price_series.iloc[idx]
            return (future_price - price) / price
        except KeyError:
            return np.nan

    price_series_head = truncate_series_tail(price_series, lookback)
    returns = [calc_future_return(date, price) for (date, price) in price_series_head.iteritems()]
    return pd.Series(returns, name="peekahead.{}".format(lookback), index=price_series_head.index)


def coefficient_of_variation(price_series):
    variations = [variation(price_series.truncate(after=date)) for date in price_series.index]
    return pd.Series(variations, name="coefficient of variation", index=price_series.index)
