import math

def finite(value):
    return value is not None and isinstance(value, (int, float)) and math.isfinite(value)

def c_to_k(value): return value + 273.15
def k_to_c(value): return value - 273.15
def c_to_f(value): return 1.8 * value + 32
def f_to_c(value): return (value - 32) / 1.8
def kmh_to_ms(value): return value / 3.6

def checked_celsius(value):
    if not finite(value) or not -100 <= value <= 100:
        raise ValueError('Invalid Celsius value; possible Kelvin/unit error')
    return float(value)

def json_safe(value):
    """No NaN or infinity may escape into a public JSON document."""
    if isinstance(value, dict): return {k: json_safe(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)): return [json_safe(v) for v in value]
    if hasattr(value, 'item'): return json_safe(value.item())
    if isinstance(value, float) and not math.isfinite(value): return None
    return value
