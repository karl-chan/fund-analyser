from client.funds import stream_funds
from lib.fund.fund import FundShareClass, FundType


def test_stream_funds():
    funds = [entry.fund for entry in stream_funds(["GB00B80QG615"])]
    assert len(funds) == 1

    actual = funds[0]
    assert actual.isin == "GB00B80QG615"
    assert actual.name == "HSBC American Index Fund Accumulation C"
    assert actual.type == FundType.OEIC
    assert actual.shareClass == FundShareClass.ACC
    assert actual.frequency == "Daily"
    assert len(actual.holdings) == 10
    assert list(actual.returns.keys()) == ["5Y", "3Y", "1Y", "6M", "3M", "1M", "2W", "1W", "3D", "1D"]
