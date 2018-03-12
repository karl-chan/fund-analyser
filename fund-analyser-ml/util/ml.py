import pandas as pd
from keras.utils import to_categorical
from sklearn.model_selection import train_test_split
from util.date import to_timedelta
from sklearn.preprocessing import MinMaxScaler

def labels_from_bounds(bounds):
    labels = []
    for i in range(0, len(bounds)-1):
        left_bound = bounds[i]
        right_bound = bounds[i+1]
        labels.append('{} to {}'.format(left_bound, right_bound))
    return labels


def form_dataset_from_stats(stats, bounds, test_split=0.2, random=True, limit_timeframe=None):
    x = stats.iloc[:, :-1]
    y = stats.iloc[:, -1]

    # Preserve only last timeframe of dataset for analysis
    if limit_timeframe is not None:
        cutoff = pd.to_datetime('today') - to_timedelta(limit_timeframe)
        x = x.truncate(cutoff)
        y = y.truncate(cutoff)

    x = x.as_matrix()
    y = y.as_matrix()
    if random:
        x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=test_split)
    else:
        if test_split >= 1:
            # Treat test split as absolute number if > 1
            boundary = int(x.shape[0] - test_split)
        else:
            # Treat test split as ratio if 0 <= ... < 1
            boundary = int(x.shape[0] * (1 - test_split))
        x_train, x_test = x[:boundary], x[boundary:]
        y_train, y_test = y[:boundary], y[boundary:]
    return x_train, x_test, y_train, y_test