import argparse
from os.path import join

import numpy as np
import pandas as pd
from keras.layers import Dense, Dropout
from keras.models import Sequential
from sklearn.metrics import confusion_matrix
from sklearn.preprocessing import MinMaxScaler

from data.historic_prices import get_historic_prices
from data.stats import stats_from_historic_prices
from util.ml import labels_from_bounds, form_dataset_from_stats
from util.path import project_root

# lookbacks = ["1Y", "6M", "3M", "1M", "2W", "1W", "3D", "1D"]
lookbacks = ["{}B".format(t) for t in range(365, 0, -1)]

target = "3B"
# bounds = [-np.inf, -0.02, -0.01, -0.005, 0, 0.005, 0.01, 0.02, np.inf]
# bounds = [-np.inf, -0.04, -0.02, 0, 0.02, 0.04, np.inf]
bounds = [-np.inf, 0, 0.01, np.inf]

labels = labels_from_bounds(bounds)

if __name__ == "__main__":
    isin = "gb00b80qg615"
    source = "ft"
    limit_timeframe = None
    validation_split = 0.333
    test_split = 0.2
    epochs = 50

    parser = argparse.ArgumentParser(description="Single Stock Neural Network")
    parser.add_argument("--lazy", action="store_true")
    args = parser.parse_args()

    if args.lazy:
        stats = pd.read_csv(join(project_root(), "stats.csv"), index_col=0, parse_dates=True)
    else:
        # get data
        print("Getting historic prices from {} for {}...".format(source, isin))
        prices = get_historic_prices(isin, "ft")
        print("Got historic prices.")

        print("Calculating stats...")
        stats = stats_from_historic_prices(prices, lookbacks, target)
        print("Calculated stats.")

        prices.to_csv(join(project_root(), "prices.csv"))
        stats.to_csv(join(project_root(), "stats.csv"))

    print("Splitting training / test set...")
    x_train, x_test, y_train, y_test = form_dataset_from_stats(stats, bounds, test_split=test_split, random=False,
                                                               limit_timeframe=limit_timeframe)
    np.savetxt("x_train.txt", x_train)
    np.savetxt("x_test.txt", x_test)
    np.savetxt("y_train.txt", y_train)
    np.savetxt("y_test.txt", y_test)
    print("Split training / test set.")

    print("Constructing model...")
    model = Sequential()
    model.add(Dense(50, input_shape=(x_train.shape[1],), activation="relu"))
    model.add(Dropout(0.5))
    model.add(Dense(17, activation="relu"))
    model.add(Dropout(0.5))
    model.add(Dense(len(bounds) - 1, activation="softmax"))
    print("Constructed model.")

    print("Compiling model...")
    model.compile(loss="categorical_crossentropy", optimizer="adam", metrics=["accuracy"])
    print("Compiled model.")

    print("Fitting model...")
    model.fit(x_train, y_train, epochs=epochs, validation_split=validation_split, verbose=2)
    print("Fitted model.")

    print("Evaluating model...")
    scores = model.evaluate(x_test, y_test)
    print("Evaluated model.")
    print("\n%s: %.2f%%" % (model.metrics_names[1], scores[1] * 100))

    print("Predicting model...")
    y_pred = model.predict(x_test)

    prediction = np.argmax(y_pred, axis=1)
    actual = np.argmax(y_test, axis=1)
    conf_matrix = confusion_matrix(actual, prediction, labels=list(range(len(labels))))

    pd.DataFrame(conf_matrix, index=labels, columns=labels).to_csv(join(project_root(), 'confusion_matrix.csv'))
