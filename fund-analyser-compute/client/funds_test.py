from client.funds import get_funds


def test_get_fund():
    funds = get_funds(["GB00B80QG615"])
    assert len(funds) == 1
    assert funds[0]
