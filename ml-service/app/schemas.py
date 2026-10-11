from pydantic import BaseModel, Field


class Features(BaseModel):
    rain1h: float = Field(ge=0, le=300)
    humidity: float = Field(ge=0, le=100)
    temp: float = Field(ge=-10, le=55)
    windSpeed: float = Field(default=0, ge=0, le=150)
    lowLying: float = Field(ge=0, le=1)
    drainage: float = Field(ge=0, le=1)
    waterProximity: float = Field(ge=0, le=1)
    populationDensity: float = Field(ge=0)


class Prediction(BaseModel):
    score: float
    level: str
    model: str