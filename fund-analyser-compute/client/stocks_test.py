from client.stocks import stream_stocks


def test_stream_stocks():
    entries = list(stream_stocks(["AAPL"]))
    assert len(entries) == 1

    stock, historic_prices = entries[0].stock, entries[0].historic_prices
    assert stock.symbol == "AAPL"
    assert stock.name == "Apple Inc."
    assert list(stock.returns.keys()) == ["5Y", "3Y", "1Y", "6M", "3M", "1M", "2W", "1W", "3D", "1D"]
    assert {'price', 'open', 'high', 'low', 'close', 'volume'}.issubset(historic_prices.columns)
