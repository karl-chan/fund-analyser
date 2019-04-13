import numpy as np


def replace_nan(x, replacement=None):
    return replacement if np.isnan(x) else x
