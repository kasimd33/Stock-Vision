"""
json_encoder.py — Recursively converts NumPy/Pandas types to
native Python so Flask's jsonify never raises TypeError.
"""
import math
import numpy as np

try:
    import pandas as pd
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False


def _clean(val):
    # pandas Timestamp
    if HAS_PANDAS and isinstance(val, pd.Timestamp):
        return val.isoformat()
    # numpy integer family
    if isinstance(val, (np.integer,)):
        return int(val)
    # numpy float family
    if isinstance(val, (np.floating,)):
        f = float(val)
        return None if (math.isnan(f) or math.isinf(f)) else f
    # numpy bool
    if isinstance(val, np.bool_):
        return bool(val)
    # numpy array / pandas Series
    if isinstance(val, (np.ndarray,)):
        return [_clean(v) for v in val.tolist()]
    if HAS_PANDAS and isinstance(val, pd.Series):
        return [_clean(v) for v in val.tolist()]
    # plain Python float NaN/Inf guard
    if isinstance(val, float):
        return None if (math.isnan(val) or math.isinf(val)) else val
    # recurse into dict / list
    if isinstance(val, dict):
        return {k: _clean(v) for k, v in val.items()}
    if isinstance(val, (list, tuple)):
        return [_clean(v) for v in val]
    return val


def safe(data):
    """Return a JSON-safe copy of any nested structure."""
    return _clean(data)
