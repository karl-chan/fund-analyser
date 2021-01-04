import pandas as pd

from lib.stock import stock_cache


def test_get():
    stocks = stock_cache.get()
    assert len(stocks) > 400


def test_get_prices():
    prices_df, volume_df = stock_cache.get_prices()
    for df in (prices_df, volume_df):
        assert isinstance(df, pd.DataFrame)
        assert isinstance(df.index, pd.DatetimeIndex)
        assert len(df.columns) > 400
