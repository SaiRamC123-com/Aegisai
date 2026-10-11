from fastapi import APIRouter, Request

from app.schemas import Features, Prediction

router = APIRouter()

FEATURES = [
    "rain1h", "humidity", "temp", "windSpeed",
    "lowLying", "drainage", "waterProximity", "populationDensity",
]


def clamp(x: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, x))


def level_for(score: float) -> str:
    if score >= 75:
        return "critical"
    if score >= 55:
        return "high"
    if score >= 30:
        return "moderate"
    return "low"


def heuristic_score(f: Features) -> float:
    flood = (
        35 * clamp(f.rain1h / 50)
        + 10 * clamp((f.humidity - 60) / 40)
        + 15 * f.lowLying
        + 15 * (1 - f.drainage)
        + 15 * f.waterProximity
        + 10 * clamp(f.populationDensity / 20000)
    )
    heat = (
        70 * clamp((f.temp - 32) / 12)
        + 15 * clamp(f.populationDensity / 20000)
        + 15 * clamp((f.humidity - 50) / 50)
    )
    return max(flood, heat)


@router.post("/predict", response_model=Prediction)
def predict(features: Features, request: Request):
    bundle = request.app.state.bundle

    if bundle is None:
        score, model_name = heuristic_score(features), "heuristic-fallback"
    else:
        row = [[getattr(features, name) for name in bundle["features"]]]
        score = float(bundle["model"].predict(row)[0])
        model_name = "gradient-boosting"

    score = round(clamp(score, 0, 100), 1)
    return Prediction(score=score, level=level_for(score), model=model_name)