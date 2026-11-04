"""
ML pipeline: trains on time-ordered data (NEVER shuffled), predicts an
N-day forward expected return, and reports honest out-of-sample metrics.

This does not claim to predict the market. It reports directional
accuracy and error metrics on a held-out test period so the AI Agent
can weigh the prediction against other signals rather than trust it blindly.
"""
from dataclasses import dataclass, field
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from ..indicators.technical import build_feature_frame
from ..config import settings

FEATURE_COLUMNS = [
    "sma_5", "sma_10", "sma_20", "sma_50",
    "ema_9", "ema_20",
    "rsi_14", "macd", "macd_signal", "macd_hist",
    "bb_upper", "bb_lower",
    "atr_14", "roc_10", "stoch_k", "volatility_20",
]


@dataclass
class ModelMetrics:
    mae: float
    rmse: float
    r2: float
    directional_accuracy: float


@dataclass
class PredictionResult:
    expected_return: float          # forward N-day return, as a fraction e.g. 0.021
    predicted_price: float
    confidence: float                # 0-100, derived from model agreement + historical accuracy
    signal: str                      # BUY / SELL / HOLD
    model_used: str
    metrics: ModelMetrics = field(default=None)


class PricePredictor:
    """
    Ensemble of a Linear Regression baseline and a Random Forest, trained
    to predict the N-day-forward return. XGBoost/LSTM are natural next
    additions behind the same interface -- see LIMITATIONS.md in the docs.
    """

    def __init__(self, horizon_days: int = None):
        self.horizon = horizon_days or settings.prediction_horizon_days
        self.lr = LinearRegression()
        self.rf = RandomForestRegressor(n_estimators=200, max_depth=6, random_state=42)
        self._fitted = False
        self._last_metrics: dict[str, ModelMetrics] = {}

    def _prepare(self, df: pd.DataFrame):
        feat = build_feature_frame(df)
        feat["target"] = feat["close"].shift(-self.horizon) / feat["close"] - 1
        feat = feat.dropna(subset=FEATURE_COLUMNS + ["target"])
        X = feat[FEATURE_COLUMNS]
        y = feat["target"]
        return feat, X, y

    def train(self, df: pd.DataFrame) -> dict[str, ModelMetrics]:
        feat, X, y = self._prepare(df)
        if len(X) < 60:
            raise ValueError("Not enough history to train (need >= 60 usable rows)")

        # Chronological split -- never shuffle time series data.
        split = int(len(X) * 0.8)
        X_train, X_test = X.iloc[:split], X.iloc[split:]
        y_train, y_test = y.iloc[:split], y.iloc[split:]

        metrics = {}
        for name, model in (("linear_regression", self.lr), ("random_forest", self.rf)):
            model.fit(X_train, y_train)
            preds = model.predict(X_test)
            mae = mean_absolute_error(y_test, preds)
            rmse = float(np.sqrt(mean_squared_error(y_test, preds)))
            r2 = r2_score(y_test, preds)
            directional_acc = float(np.mean(np.sign(preds) == np.sign(y_test)))
            metrics[name] = ModelMetrics(mae=mae, rmse=rmse, r2=r2,
                                          directional_accuracy=directional_acc)
        self._last_metrics = metrics
        self._fitted = True
        return metrics

    def predict(self, df: pd.DataFrame) -> PredictionResult:
        if not self._fitted:
            self.train(df)

        feat = build_feature_frame(df)
        latest = feat[FEATURE_COLUMNS].ffill().iloc[[-1]]

        pred_lr = float(self.lr.predict(latest)[0])
        pred_rf = float(self.rf.predict(latest)[0])
        expected_return = 0.4 * pred_lr + 0.6 * pred_rf  # RF weighted higher (more robust)

        current_price = float(df["close"].iloc[-1])
        predicted_price = current_price * (1 + expected_return)

        # Confidence blends model agreement with historical directional accuracy.
        agreement = 1 - min(abs(pred_lr - pred_rf) / (abs(expected_return) + 1e-6), 1)
        hist_acc = self._last_metrics.get("random_forest").directional_accuracy if self._last_metrics else 0.5
        confidence = float(np.clip(50 * agreement + 100 * hist_acc, 0, 100) / 1.5)
        confidence = float(np.clip(confidence, 5, 95))  # never claim certainty

        if expected_return >= settings.buy_threshold:
            signal = "BUY"
        elif expected_return <= settings.sell_threshold:
            signal = "SELL"
        else:
            signal = "HOLD"

        return PredictionResult(
            expected_return=expected_return,
            predicted_price=predicted_price,
            confidence=round(confidence, 1),
            signal=signal,
            model_used="ensemble(linear_regression+random_forest)",
            metrics=self._last_metrics.get("random_forest"),
        )
