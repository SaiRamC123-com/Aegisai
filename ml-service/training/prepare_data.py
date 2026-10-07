from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "risk_data.csv"

rng = np.random.default_rng(42)
N = 20000


def clamp(x, lo=0.0, hi=1.0):
    return np.clip(x, lo, hi)


df = pd.DataFrame({
    "rain1h": np.clip(rng.gamma(1.2, 12, N), 0, 150),
    "humidity": rng.uniform(40, 100, N),
    "temp": np.clip(rng.normal(31, 5, N), 15, 48),
    "windSpeed": np.clip(rng.gamma(2, 2.5, N), 0, 40),
    "lowLying": rng.beta(2, 2, N),
    "drainage": rng.beta(2.5, 2, N),
    "waterProximity": rng.beta(2, 2.5, N),
    "populationDensity": rng.uniform(1000, 25000, N),
})

flood = (
    35 * clamp(df.rain1h / 50)
    + 10 * clamp((df.humidity - 60) / 40)
    + 15 * df.lowLying
    + 15 * (1 - df.drainage)
    + 15 * df.waterProximity
    + 10 * clamp(df.populationDensity / 20000)
)
# Interaction the plain formula misses: heavy rain + low ground + poor drainage compounds
flood += 12 * clamp(df.rain1h / 60) * df.lowLying * (1 - df.drainage)

heat = (
    70 * clamp((df.temp - 32) / 12)
    + 15 * clamp(df.populationDensity / 20000)
    + 15 * clamp((df.humidity - 50) / 50)
)

df["score"] = np.clip(np.maximum(flood, heat) + rng.normal(0, 2, N), 0, 100).round(2)

OUT.parent.mkdir(exist_ok=True)
df.to_csv(OUT, index=False)
print(f"Saved {len(df)} rows to {OUT}")
print(df["score"].describe().round(1))