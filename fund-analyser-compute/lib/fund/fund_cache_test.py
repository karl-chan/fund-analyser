from lib.fund import fund_cache


def test_get():
    funds = fund_cache.get()
    assert len(funds) > 3000
