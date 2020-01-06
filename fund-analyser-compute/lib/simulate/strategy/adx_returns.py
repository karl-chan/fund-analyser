from __future__ import annotations

from datetime import date
from typing import List

import pandas as pd
from overrides import overrides

from lib.indicators.indicator_utils import adx
from lib.simulate.simulator import Simulator
from lib.simulate.strategy.strategy import Strategy
from lib.util.dates import BDAY


class AdxReturns(Strategy):

    def _max_adx(self, dt: date) -> List[str]:
        period = 3 * BDAY

        strong_adx_isins = self._adxs_strong_sign.columns[self._adxs_strong_sign[dt - period:dt].all(axis=0)]
        # inc_adx_isins = adxs_grad_sign.columns[adxs_grad_sign[dt - period:dt].all(axis=0)]
        # dis_pos_isins = diff_dis_sign.columns[diff_dis_sign[dt - period:dt].all(axis=0)]
        diverging_di_isins = self._diff_dis_grad_sign.columns[self._diff_dis_grad_sign[dt - period: dt].all(axis=0)]

        isins = set.intersection(
            set(strong_adx_isins),
            # set(inc_adx_isins),
            # set(dis_pos_isins),
            set(diverging_di_isins)
        )
        return list(isins)

    @overrides
    def run(self, dt: date, prices_df: pd.DataFrame, fees_df: pd.DataFrame) -> List[str]:
        return self._max_adx(dt)

    @overrides
    def on_data_ready(self, data: Simulator.Data) -> None:
        adxs, plus_dis, minus_dis = adx(data.prices_df)
        self._adxs_strong_sign = adxs.gt(25)
        adxs_grad_sign = adxs.diff().gt(0)
        diff_dis = plus_dis - minus_dis
        diff_dis_sign = diff_dis.gt(0)
        diff_dis_grad = diff_dis.diff()
        self._diff_dis_grad_sign = diff_dis_grad.gt(0)


if __name__ == "__main__":
    simulator = Simulator(
        strategy=AdxReturns()
    )
    results = simulator.run()
    Simulator.describe_and_plot(results)
