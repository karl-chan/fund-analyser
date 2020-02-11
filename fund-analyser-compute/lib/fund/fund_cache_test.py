import pandas as pd

from lib.fund import fund_cache


def test_get():
    funds = fund_cache.get()
    assert len(funds) > 3000


def test_get_prices():
    prices_df = fund_cache.get_prices()
    assert isinstance(prices_df, pd.DataFrame)
    assert isinstance(prices_df.index, pd.DatetimeIndex)
    assert len(prices_df.columns) > 3000


def test_get_corr():
    corr_df = fund_cache.get_corr()
    assert isinstance(corr_df, pd.DataFrame)
    assert list(corr_df.index) == list(corr_df.columns)
    assert len(corr_df.columns) > 3000
