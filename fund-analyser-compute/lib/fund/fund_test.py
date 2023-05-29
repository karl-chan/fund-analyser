from datetime import datetime, timezone

from lib.fund.fund import Fund, FundHolding, FundIndicator, FundRealTimeDetails, FundRealTimeHolding, \
    FundType, FundShareClass


def test_from_dict():
    dict = {
        "isin": "GB00B80QG615",
        "name": "HSBC American Index Fund Accumulation C",
        "type": "OEIC",
        "shareClass": "Acc",
        "frequency": "Daily",
        "ocf": 0.0006,
        "amc": None,
        "entryCharge": None,
        "exitCharge": 0,
        "bidAskSpread": 0,
        "holdings": [{
            "name": "Microsoft Corp",
            "symbol": "MSFT:NSQ",
            "weight": 0.0364
        }],
        "historicPrices": [
            {"date": "2009-04-09T00:00:00.000Z", "price": 1.276}
        ],
        "returns": {
            "5Y": 1.096
        },
        "asof": "2019-04-05T00:00:00.000Z",
        "indicators": {
            "stability": {
                "value": 1.974
            }
        },
        "realTimeDetails": {
            "estChange": 0.003,
            "estPrice": 5.845,
            "stdev": 0.002,
            "ci": [-0.001, 0.007],
            "holdings": [{
                "name": "Microsoft Corp",
                "symbol": "MSFT:NSQ",
                "currency": "USD",
                "todaysChange": 0.0044,
                "weight": 0.0364
            }],
            "lastUpdated": "2019-04-07T14:22:28.974Z"
        }
    }
    expected = Fund(
        isin="GB00B80QG615",
        name="HSBC American Index Fund Accumulation C",
        type=FundType.OEIC,
        shareClass=FundShareClass.ACC,
        frequency="Daily",
        ocf=0.0006,
        amc=None,
        entryCharge=None,
        exitCharge=0,
        bidAskSpread=0,
        holdings=[
            FundHolding(
                name="Microsoft Corp",
                symbol="MSFT:NSQ",
                weight=0.0364
            )],
        returns={
            "5Y": 1.096
        },
        asof=datetime(2019, 4, 5, tzinfo=timezone.utc),
        indicators={
            "stability": FundIndicator(value=1.974)
        },
        realTimeDetails=FundRealTimeDetails(
            estChange=0.003,
            estPrice=5.845,
            stdev=0.002,
            ci=(-0.001, 0.007),
            holdings=[
                FundRealTimeHolding(
                    name="Microsoft Corp",
                    symbol="MSFT:NSQ",
                    weight=0.0364,
                    currency="USD",
                    todaysChange=0.0044
                )],
            lastUpdated=datetime(2019, 4, 7, 14, 22, 28, 974000, tzinfo=timezone.utc))
    )

    actual = Fund.from_dict(dict)
    assert actual == expected
