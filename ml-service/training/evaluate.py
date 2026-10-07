from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

ROOT = Path(__file__).resolve().parents[1]
bundle = joblib.load(ROOT / "saved_models" / "risk_model.joblib")
model, FEATURES = bundle["model"], bundle["features"]

df = pd.read_csv(ROOT / "data" / "risk_data.csv")
_, X_test, _, y_test = train_test_split(
    df[FEATURES], df["score"], test_size=0.2, random_state=42
)
pred = model.predict(X_test)


def bucket(s):
    return np.digitize(s, [30, 55, 75])  # low, moderate, high, critical


print(f"MAE : {mean_absolute_error(y_test, pred):.2f}")
print(f"RMSE: {np.sqrt(mean_squared_error(y_test, pred)):.2f}")
print(f"R2  : {r2_score(y_test, pred):.3f}")
print(f"Risk-level accuracy: {(bucket(y_test) == bucket(pred)).mean() * 100:.1f}%")

print("\nFeature importance:")
for name, imp in sorted(zip(FEATURES, model.feature_importances_), key=lambda x: -x[1]):
    print(f"  {name:<18} {imp:.3f}")