"""PredictionAgent: owns the ML model lifecycle for a given symbol (train/cache/predict)."""
import pandas as pd
from ..ml.models import PricePredictor, PredictionResult


class PredictionAgent:
    def __init__(self):
        self._predictors: dict[str, PricePredictor] = {}

    def predict(self, symbol: str, df: pd.DataFrame) -> PredictionResult:
        predictor = self._predictors.setdefault(symbol, PricePredictor())
        return predictor.predict(df)
