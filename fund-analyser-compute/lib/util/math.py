from typing import Optional

import numpy as np


def replace_nan(x: float, replacement=None) -> Optional[float]:
    return replacement if np.isnan(x) else x


# Formats float to 2dp
def format_float(x: float) -> str:
    return f"{x:.2f}"
