from __future__ import annotations

from datetime import date
from typing import NamedTuple, List, Dict, Optional

import numpy as np
import pandas as pd

from lib.fund import fund_cache
from lib.util import properties
from lib.util.dates import format_date
from lib.util.pandas import pd_offset_from_lookback


class AccountStatement(NamedTuple):
    class HistoricPrice(NamedTuple):
        date: date
        price: Optional[float]

        def as_dict(self) -> Dict:
            return {
                "date": format_date(self.date),
                "price": self.price
            }

    class Event(NamedTuple):
        class Holding(NamedTuple):
            isin: str
            name: str
            sedol: str
            weight: float

        type: str
        from_date: date
        to_date: date
        holdings: List[Holding]
        pct_change: float

        def as_dict(self) -> Dict:
            return {
                "type": self.type,
                "from": format_date(self.from_date),
                "to": format_date(self.to_date),
                "holdings": [holding._asdict() for holding in self.holdings],
                "pctChange": self.pct_change
            }

    series: List[HistoricPrice]
    events: List[Event]
    returns: Dict[str, Optional[float]]

    @classmethod
    def from_account(cls, account: pd.DataFrame) -> AccountStatement:
        augmented = cls._augment_account(account)
        return AccountStatement(
            series=cls._to_series(augmented),
            events=cls._to_events(account),
            returns=cls._to_returns(augmented)
        )

    @classmethod
    def _augment_account(cls, account: pd.DataFrame) -> pd.DataFrame:
        account_isins = set(isin for isins in account["isins"].tolist() if isins for isin in isins)
        prices_df = fund_cache.get_prices(account_isins)
        prices_ratios_df = prices_df.pct_change() + 1

        values_series = account.reindex(index=prices_df.index)["value"]
        isins_series = account.reindex(index=prices_df.index, method="bfill")["isins"]
        augmented = pd.concat([values_series, isins_series], axis=1) \
            .truncate(before=account.first_valid_index(),
                      after=account.last_valid_index())
        for i in range(len(augmented.index) - 1):
            dt = augmented.index[i]
            curr_value, next_value = augmented.iloc[i]["value"], augmented.iloc[i + 1]["value"]
            next_isins = augmented.iloc[i + 1]["isins"]
            if np.isnan(next_value):
                if next_isins is None:
                    augmented.at[augmented.index[i + 1], "value"] = curr_value
                else:
                    augmented.at[augmented.index[i + 1], "value"] = \
                        curr_value * prices_ratios_df.loc[dt, next_isins].mean()
        augmented["value"] = augmented["value"].bfill()  # fill initial NaNs with 100
        return augmented

    @classmethod
    def _to_series(cls, augmented: pd.DataFrame) -> List[HistoricPrice]:
        historic_prices = []
        for dt, row in augmented.iterrows():
            price = None if np.isnan(row["value"]) else row["value"]
            historic_prices.append(AccountStatement.HistoricPrice(dt.date(), price))
        return historic_prices

    @classmethod
    def _to_events(cls, account: pd.DataFrame) -> List[Event]:
        events = []
        for i in range(len(account.index) - 1):
            next_isins = account.iloc[i + 1, :]["isins"]
            if next_isins is not None:
                next_funds = fund_cache.get(next_isins)
                events.append(AccountStatement.Event(
                    type="fund",
                    from_date=account.index[i],
                    to_date=account.index[i + 1],
                    holdings=[
                        AccountStatement.Event.Holding(
                            isin=fund.isin,
                            name=fund.name,
                            sedol=fund.sedol,
                            weight=1 / len(next_isins)
                        ) for fund in next_funds
                    ],
                    pct_change=(account["value"].iat[i + 1] / account["value"].iat[i]) - 1
                ))
        return events

    @classmethod
    def _to_returns(cls, augmented: pd.DataFrame) -> Dict[str, Optional[float]]:
        returns = dict()
        lookbacks = properties.get("fund.lookbacks")
        dt = augmented.last_valid_index()
        for lookback in lookbacks:
            window = augmented[dt - pd_offset_from_lookback(lookback): dt]["value"]
            returns[lookback] = (window.iat[-1] - window.iat[0]) / window.iat[0] \
                if len(window.index) \
                else None
        return returns

    def as_dict(self) -> Dict:
        return {
            "series": [historic_price.as_dict() for historic_price in self.series],
            "events": [event.as_dict() for event in self.events],
            "returns": self.returns
        }
