from datetime import datetime, date

import pandas as pd

from lib.fund.fund_utils import min_recovery_date


def test_min_recovery_date():
    prices_df = pd.DataFrame(
        [[101.0, 101.0],
         [101.0, 102.0],
         [103.0, 102.0],
         [103.0, 103.0],
         [102.0, 103.0],
         [102.0, 102.0],
         [101.0, 104.0],
         [102.0, 104.0]],
        index=pd.date_range(datetime(2001, 1, 1), datetime(2001, 1, 8)),
        columns=["isin1", "isin2"]
    )
    assert min_recovery_date(prices_df, datetime(2001, 1, 4), ["isin1", "isin2"]) == date(2001, 1, 8)
    assert min_recovery_date(prices_df, datetime(2001, 1, 8), ["isin1", "isin2"]) is None
