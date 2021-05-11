# type: ignore
import math
import pdb
from datetime import date
from typing import Tuple

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from overrides import overrides
from tensorflow.python.keras import Sequential
from tensorflow.python.keras.callbacks import EarlyStopping
from tensorflow.python.keras.layers import AveragePooling1D, Dense, GlobalAveragePooling1D, SeparableConv1D
from tensorflow.python.keras.optimizers import Adam
from tensorflow.python.keras.utils import Sequence

from lib.fund import fund_cache
from lib.util.dates import BDAY

pd.set_option('display.max_colwidth', 10000)

peek_interval_days = 126
peek_interval = peek_interval_days * BDAY  # roughly 6 months
hold_interval_days = 5
hold_interval = hold_interval_days * BDAY  # roughly 1 week
start_date = date(2017, 1, 1)
end_date = (date.today() - BDAY).date()

expected_hold_return = 0.03  # 3%
kernel_size_first_layer = 3  # approx 1 month
kernel_size_second_layer = 3
kernel_size_third_layer = 3
batch_size = 10000

prices_df = fund_cache.get_prices().rolling(3).mean()
pct_changes = prices_df.pct_change()
future_returns = prices_df.pct_change(periods=hold_interval_days).shift(
    periods=-hold_interval_days)


class DataGenerator(Sequence):

    def __init__(self, start: date = start_date + peek_interval,
                 end: date = end_date,
                 batch_size: int = 1) -> None:
        super().__init__()
        self.num_funds = len(prices_df.columns)
        self.batch_size = batch_size
        self.dt_range = pd.date_range(start, end, freq="B")

    def __len__(self):
        return math.ceil(len(self.dt_range) * self.num_funds / self.batch_size)

    def __getitem__(self, batch_num):
        start_dt_index, start_offset = divmod(batch_num * self.batch_size, self.num_funds)
        dt_index_span, end_offset = divmod(start_offset + self.batch_size, self.num_funds)
        end_dt_index = start_dt_index + dt_index_span
        if end_dt_index >= len(self.dt_range):  # prevent overflow
            end_dt_index, end_offset = len(self.dt_range) - 1, self.num_funds

        def get_data_for_date(dt_index: int) -> Tuple[np.array, np.array]:
            dt = self.dt_range[dt_index]
            window = pct_changes.truncate(after=dt - BDAY).tail(peek_interval_days)
            window_future_returns = future_returns.loc[dt, :]

            agg = pd.concat([window, window_future_returns.to_frame().transpose()]).dropna(axis=1).transpose()
            dt_xs = agg.iloc[:, :-1].values
            dt_ys = agg.iloc[:, -1].values
            return dt_xs, dt_ys

        def batch_data(start_dt_index: int, start_offset: int, end_dt_index, end_offset: int) \
                -> Tuple[np.array, np.array]:
            if end_dt_index > start_dt_index:
                xs_start, ys_start = get_data_for_date(start_dt_index)
                xms, yms = [], []
                for i in range(start_dt_index + 1, end_dt_index):
                    xs, ys = get_data_for_date(i)
                    xms.append(xs)
                    yms.append(ys)
                xss_mid, yss_mid = (np.concatenate(xms), np.concatenate(yms)) if xms \
                    else (np.empty((0, peek_interval_days)), np.empty((0)))
                xs_end, ys_end = get_data_for_date(end_dt_index)
                return np.concatenate((xs_start[start_offset:], xss_mid, xs_end[:end_offset])), \
                       np.concatenate((ys_start[start_offset:], yss_mid, ys_end[:end_offset]))

            else:
                xs, ys = get_data_for_date(start_dt_index)
                return xs[start_offset: end_offset], ys[start_offset: end_offset]

        batch_xs, batch_ys = batch_data(start_dt_index, start_offset, end_dt_index, end_offset)
        return np.expand_dims(batch_xs, axis=2) * 100, (batch_ys >= expected_hold_return).astype(int)


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


    train_bounary, validation_boundary = train_validation_test_split(start_date, end_date)

    train_generator = DataGenerator(start=start_date, end=train_bounary, batch_size=batch_size)
    validation_generator = DataGenerator(start=train_bounary, end=validation_boundary, batch_size=batch_size)

    test_generator_positive = PositiveDataGenerator(start=validation_boundary, end=end_date, batch_size=batch_size)
    test_generator_negative = NegativeDataGenerator(start=validation_boundary, end=end_date, batch_size=batch_size)

    model = Sequential()
    model.add(SeparableConv1D(30, kernel_size_first_layer, input_shape=(peek_interval_days, 1), activation="relu"))
    model.add(AveragePooling1D())
    model.add(SeparableConv1D(10, kernel_size_second_layer, activation="relu"))
    model.add(AveragePooling1D())
    model.add(SeparableConv1D(3, kernel_size_third_layer, activation="relu"))
    model.add(GlobalAveragePooling1D())
    model.add(Dense(1, activation="sigmoid"))
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
