import pandas as pd

from lib.stock import stock_cache


def test_get():
    stocks = stock_cache.get()
    assert len(stocks) > 400


def test_get_prices():
    open_df, high_df, low_df, close_df, volume_df = stock_cache.get_prices()
    for prices_df in (open_df, high_df, low_df, close_df, volume_df):
        assert isinstance(prices_df, pd.DataFrame)
        assert isinstance(prices_df.index, pd.DatetimeIndex)
        assert len(prices_df.columns) > 400
