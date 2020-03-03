import pandas as pd

from client.funds import post_similar_funds, SimilarFundsEntry
from lib.fund import fund_cache
from lib.fund.fund_utils import calc_fees

THRESHOLD = 0.99


def update_similar_funds():
    funds = fund_cache.get()
    corr_df = fund_cache.get_corr()
    fees_df = calc_fees(funds)

    def to_similar_funds_entry(isin: str, corr_series: pd.Series) -> SimilarFundsEntry:
        similar_isins = corr_series[corr_series > THRESHOLD].index.tolist()

        [fund] = fund_cache.get([isin])
        fees_per_year = fees_df.at[isin, "total_one_off_fees"] + fees_df.at[isin, "total_annual_fees"]
        returns_per_year = fund.returns["1Y"]
        if returns_per_year:
            after_fees_return = returns_per_year - fees_per_year
        else:
            after_fees_return = None

        return SimilarFundsEntry(
            isin=isin,
            similar_isins=similar_isins,
            after_fees_return=after_fees_return
        )

    similar_funds = [
        to_similar_funds_entry(isin, corr_series)
        for isin, corr_series in corr_df.iterrows()
    ]
    post_similar_funds(similar_funds)
