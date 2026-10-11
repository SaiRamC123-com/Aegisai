from contextlib import asynccontextmanager
from pathlib import Path

import joblib
from fastapi import FastAPI

from app.routers import predict

MODEL_PATH = Path(__file__).resolve().parents[1] / "saved_models" / "risk_model.joblib"


@asynccontextmanager
async def lifespan(app: FastAPI):
    if MODEL_PATH.exists():
        app.state.bundle = joblib.load(MODEL_PATH)
        print(f"✅ Loaded model: {MODEL_PATH.name}")
    else:
        app.state.bundle = None
        print("⚠️  No trained model found. Using heuristic fallback. Run training/train.py")
    yield


app = FastAPI(title="AegisAI ML Service", version="1.0.0", lifespan=lifespan)
app.include_router(predict.router)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "aegisai-ml",
        "model_loaded": app.state.bundle is not None,
    }