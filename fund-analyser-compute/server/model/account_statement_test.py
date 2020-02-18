from __future__ import annotations

from datetime import date

import pandas as pd

from server.model.account_statement import AccountStatement


def test_from_account():
    account = pd.DataFrame(
        data=[
            [95.503102, None, None],
            [97.902256, ["GB00B8JYLC77"], ["Legg Mason IF Japan Equity Fund Class X Accumulation"]],
            [101.304485, ["IE00B90P3080", "IE00B4WL8048", "LU0827884411"], [
                "BNY Mellon Global Funds PLC - BNY Mellon Brazil Equity Fund Sterling W Acc",
                "Odey Investment plc - Odey Odyssey Fund I GBP Inc",
                "BlackRock Global Funds - Latin American Fund D2 GBP Hedged"]],
            [102.416901, ["IE00B90P3080"],
             ["BNY Mellon Global Funds PLC - BNY Mellon Brazil Equity Fund Sterling W Acc"]],
            [102.416901, None, None],
            [102.416901, None, None],
            [102.416901, None, None],
            [103.562234, ["GB00B1XFGM25"], ["Investec Global Gold I Acc GBP"]],
            [103.985350, ["IE00B4WL8048", "GB00B99C0657"], [
                "Odey Investment plc - Odey Odyssey Fund I GBP Inc",
                "Legg Mason IF Japan Equity Fund Class X Accumulation(Hedged)"
            ]],
            [105.317174, ["GB00B1XFGM25", "IE00B90P3080", "GB00B8JYLC77", "LU0827884411", "GB00B39RMM81"], [
                "Investec Global Gold I Acc GBP",
                "BNY Mellon Global Funds PLC - BNY Mellon Brazil Equity Fund Sterling W Acc",
                "Legg Mason IF Japan Equity Fund Class X Accumulation",
                "BlackRock Global Funds - Latin American Fund D2 GBP Hedged",
                "Baillie Gifford China Fund B Accumulation"
            ]],
            [106.283754, ["GB00B39RMM81"], ["Baillie Gifford China Fund B Accumulation"]]
        ],
        index=[
            date(2014, 12, 29),
            date(2015, 1, 5),
            date(2015, 1, 13),
            date(2015, 1, 21),
            date(2015, 1, 23),
            date(2015, 1, 26),
            date(2015, 1, 27),
            date(2015, 2, 3),
            date(2015, 2, 11),
            date(2015, 2, 19),
            date(2015, 2, 27)
        ],
        columns=["value", "isins", "names"]
    )

    statement = AccountStatement.from_account(account)
    assert len(statement.series) == 45
    assert len(statement.events) == 7
    assert statement.returns == {"5Y": 0.11288274175638822, "3Y": 0.11288274175638822, "1Y": 0.11288274175638822,
                                 "6M": 0.11288274175638822, "3M": 0.11288274175638822, "1M": 0.037756004743787416,
                                 "2W": 0.014316568068459804, "1W": 0.009302325581395529, "3D": 0.007739938080495415,
                                 "1D": 0.009302325581395257}
