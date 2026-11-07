from .units import finite

def indicative(tmax, normal=None):
    if not finite(tmax): return 'unknown_departure'
    if tmax >= 47: return 'severe_heat_wave'
    if tmax >= 45: return 'heat_wave'
    if not finite(normal): return 'unknown_departure'
    if tmax < 40: return 'no'
    departure = tmax-normal
    # Binary subtraction at decimal thresholds can introduce representation error.
    if departure > 6.4 and abs(departure-6.4)>1e-12: return 'severe_heat_wave'
    if departure >= 4.5 or abs(departure-4.5)<1e-12: return 'heat_wave'
    return 'no'
