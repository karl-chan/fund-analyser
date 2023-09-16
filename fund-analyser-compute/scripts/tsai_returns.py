import numpy as np
from fastai.losses import CrossEntropyLossFlat
from fastai.metrics import accuracy, F1Score, Precision, Recall
from tsai.data.core import TSClassification
from tsai.data.validation import get_splits
from tsai.models.RNN_FCN import LSTM_FCN
from tsai.tslearner import TSClassifier
from tsai.utils import to3d

from lib.stock import stock_cache
from lib.util.logging_utils import log_debug


def _generate_training_data(prices_df):
    window_width = 180  # 6 months

    xs, ys = [], []
    for i in range(len(prices_df.index) - window_width - 2):
        window_x = prices_df.iloc[i: i + window_width, :]
        window_extra = prices_df.iloc[i + window_width: i + window_width + 2, :]

        target = (window_extra.iloc[1, :] / window_extra.iloc[0, :]) > 1.01  # >1% increase
        xs.append(window_x), ys.append(target)

    X, y = to3d(np.hstack(xs).transpose()), np.hstack(ys) * 2 - 1

    return X, y


if __name__ == "__main__":
    prices_df, volume_df = stock_cache.get_prices(symbols=["AAPL", "GOOG"])
    log_debug("Got prices_df.")

    X, y = _generate_training_data(prices_df)
    log_debug("Got training data.")

    splits = get_splits(y, shuffle=False, show_plot=False)
    log_debug("Got splits.")

    clf = TSClassifier(X, y, splits=splits, path='models', arch=LSTM_FCN,
                       tfms=[None, TSClassification()],
                       loss_func=CrossEntropyLossFlat(),
                       metrics=[accuracy, Precision(), Recall(), F1Score()])
    log_debug("Created classifier.")

    log_debug("Started fitting...")
    clf.fit(100, 3e-4)
