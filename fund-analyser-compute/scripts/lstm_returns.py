import logging
import pdb
from datetime import date
from typing import Tuple

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from overrides import overrides
from tensorflow.python.keras import Sequential
from tensorflow.python.keras.callbacks import EarlyStopping
from tensorflow.python.keras.layers import Dense, LSTM
from tensorflow.python.keras.optimizers import Adam
from tensorflow.python.keras.utils import Sequence

from lib.fund import fund_cache
from lib.fund.fund_utils import merge_funds_historic_prices

logging.basicConfig(level=logging.DEBUG)
pd.set_option('display.max_colwidth', 10000)

BDAY = pd.tseries.offsets.BusinessDay(n=1)
peek_interval_days = 126
peek_interval = peek_interval_days * BDAY  # roughly 6 months
hold_interval_days = 5
hold_interval = hold_interval_days * BDAY  # roughly 1 week
start_date = date(2017, 1, 1)
today = date.today()

expected_hold_return = 0.02  # 2%
kernel_size_first_layer = 3  # approx 1 month
kernel_size_second_layer = 3
kernel_size_third_layer = 3

all_funds = fund_cache.get()
funds = all_funds
funds_lookup = {fund.isin: fund for fund in funds}

merged_historic_prices = merge_funds_historic_prices(funds)
pct_changes = merged_historic_prices.pct_change()
future_returns = merged_historic_prices.pct_change(periods=hold_interval_days).shift(
    periods=-hold_interval_days)


class DataGenerator(Sequence):

    def __init__(self, start: date = start_date + peek_interval,
                 end: date = today) -> None:
        super().__init__()
        self.dt_range = pd.date_range(start, end, freq="B")

    def __len__(self):
        return len(self.dt_range)

    def __getitem__(self, index):
        dt = self.dt_range[index]
        window = pct_changes.truncate(after=dt - BDAY).tail(peek_interval_days)
        window_future_returns = future_returns.loc[dt, :]

        agg = pd.concat([window, window_future_returns.to_frame().transpose()]).dropna(axis=1).transpose()
        if not len(agg):
            return np.zeros((0, peek_interval_days, 1)), np.zeros((0, 1))

        xs = agg.iloc[:, :-1].values
        ys = agg.iloc[:, -1].values >= expected_hold_return
        return np.expand_dims(xs, axis=2), ys.astype(int)


class PositiveDataGenerator(DataGenerator):
    @overrides
    def __getitem__(self, index):
        xs, ys = super().__getitem__(index)
        positive_indices = np.where(ys.flatten().astype("bool"))
        return xs[positive_indices], ys[positive_indices]


class NegativeDataGenerator(DataGenerator):
    @overrides
    def __getitem__(self, index):
        xs, ys = super().__getitem__(index)
        negative_indices = np.where(~ys.flatten().astype("bool"))
        return xs[negative_indices], ys[negative_indices]


if __name__ == "__main__":
    account = pd.DataFrame([[100, "", ""]], index=[start_date], columns=["value", "isin", "name"])


    def train_validation_test_split(start: date, end: date) -> Tuple[date, date]:
        train_ratio = 0.6
        validation_ratio = 0.2  # test_ratio = 1 - ... - ...
        boundary_1 = (start + train_ratio * (end - start))
        boundary_2 = (boundary_1 + validation_ratio * (end - start))
        return boundary_1, boundary_2


    train_bounary, validation_boundary = train_validation_test_split(start_date, today)

    train_generator = DataGenerator(start=start_date, end=train_bounary)
    validation_generator = DataGenerator(start=train_bounary, end=validation_boundary)

    test_generator_positive = PositiveDataGenerator(start=validation_boundary, end=today)
    test_generator_negative = NegativeDataGenerator(start=validation_boundary, end=today)

    model = Sequential()
    model.add(LSTM(32, input_shape=(peek_interval_days, 1)))
    model.add(Dense(1, activation="tanh"))
    model.compile(optimizer=Adam(),
                  loss="binary_crossentropy",
                  metrics=["accuracy"])

    model.build()
    model.summary()
    history = model.fit_generator(train_generator,
                                  epochs=1,
                                  validation_data=validation_generator,
                                  class_weight={
                                      0: 0.5,  # false
                                      1: 0.5  # true
                                  },
                                  callbacks=[
                                      EarlyStopping(monitor="val_loss", patience=5)
                                  ])


def plot_history(history):
    loss = history.history["loss"]
    val_loss = history.history["val_loss"]
    epochs = range(1, len(loss) + 1)
    plt.figure()
    plt.plot(epochs, loss, "bo", label="Training loss")
    plt.plot(epochs, val_loss, "b", label="Validation loss")
    plt.title("Training and validation loss")
    plt.legend()
    # plt.show()


plot_history(history)

predictions_pos = model.predict_generator(test_generator_positive)
predictions_neg = model.predict_generator(test_generator_negative)
pdb.set_trace()
