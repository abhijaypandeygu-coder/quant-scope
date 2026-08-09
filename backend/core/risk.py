import pandas as pd
import numpy as np
from typing import Dict, Any, List

class RiskEngine:
    @staticmethod
    def calculate_metrics(returns: pd.Series, confidence_level: float = 0.95) -> Dict[str, float]:
        """Calculate core risk metrics for a returns series."""
        if returns.empty:
            return {"var": 0.0, "volatility": 0.0, "max_drawdown": 0.0}

        # Value at Risk (Historical)
        var = np.percentile(returns.dropna(), (1 - confidence_level) * 100)

        # Annualized Volatility
        volatility = returns.std() * np.sqrt(252)

        # Max Drawdown
        cumulative = (1 + returns).cumprod()
        rolling_max = cumulative.cummax()
        drawdowns = cumulative / rolling_max - 1
        max_drawdown = drawdowns.min()

        return {
            "var": float(var),
            "volatility": float(volatility),
            "max_drawdown": float(max_drawdown)
        }

    @staticmethod
    def analyze_portfolio(prices_df: pd.DataFrame, weights: Dict[str, float]) -> Dict[str, Any]:
        """
        Analyze a multi-asset portfolio.
        prices_df: DataFrame where columns are tickers, values are daily closing prices.
        weights: Dictionary mapping ticker to portfolio weight (0.0 to 1.0).
        """
        if prices_df.empty:
            return {}

        # Ensure we only calculate for the intersection of data and weights
        tickers = [t for t in weights.keys() if t in prices_df.columns]
        if not tickers:
            return {}

        df = prices_df[tickers]
        returns = df.pct_change().dropna()
        
        # Portfolio daily returns
        weight_array = np.array([weights[t] for t in tickers])
        portfolio_returns = returns.dot(weight_array)
        
        # Portfolio metrics
        metrics = RiskEngine.calculate_metrics(portfolio_returns)
        
        # Correlation Matrix
        correlation_matrix = returns.corr().to_dict()
        
        return {
            "metrics": metrics,
            "correlation": correlation_matrix,
            "daily_returns": portfolio_returns.tail(30).to_dict() # last 30 days for chart
        }
