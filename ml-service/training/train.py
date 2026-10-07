from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error
from sklearn.model_selection import train_test_split

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "risk_data.csv"
MODEL = ROOT / "saved_models" / "risk_model.joblib"

FEATURES = [
    "rain1h", "humidity", "temp", "windSpeed",
    "lowLying", "drainage", "waterProximity", "populationDensity",
]

df = pd.read_csv(DATA)
X_train, X_test, y_train, y_test = train_test_split(
    df[FEATURES], df["score"], test_size=0.2, random_state=42
)

model = GradientBoostingRegressor(
    n_estimators=300,
    max_depth=4,
    learning_rate=0.08,
    subsample=0.8,
    random_state=42,
)
model.fit(X_train, y_train)

mae = mean_absolute_error(y_test, model.predict(X_test))
MODEL.parent.mkdir(exist_ok=True)
joblib.dump({"model": model, "features": FEATURES}, MODEL)

print(f"Test MAE: {mae:.2f} score points")
print(f"Model saved to {MODEL}")