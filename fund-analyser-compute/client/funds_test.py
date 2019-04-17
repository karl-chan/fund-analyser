from client.funds import get_funds, get_all_isins
from lib.fund.fund import FundShareClass, FundType


def test_get_funds():
    funds = get_funds(["GB00B80QG615"])
    assert len(funds) == 1

    actual = funds[0]
    assert actual.isin == "GB00B80QG615"
    assert actual.name == "HSBC American Index Fund Accumulation C"
    assert actual.type == FundType.OEIC
    assert actual.shareClass == FundShareClass.ACC
    assert actual.frequency == "Daily"
    assert len(actual.holdings) == 10
    assert len(actual.historicPrices) >= 2500
    assert list(actual.returns.keys()) == ["5Y", "3Y", "1Y", "6M", "3M", "1M", "2W", "1W", "3D", "1D"]


def test_get_all_isins():
    isins = get_all_isins()
    assert len(isins) > 3000
    for isin in isins:
        assert isinstance(isin, str)
        assert len(isin) == 12
