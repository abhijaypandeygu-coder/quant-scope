from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
from data_providers.yfinance_provider import YFinanceProvider
from core.backtest import BacktestEngine
import traceback

router = APIRouter()

class BacktestRequest(BaseModel):
    ticker: str
    strategy: str
    params: Dict[str, Any]

@router.post("/backtest")
def run_backtest(request: BacktestRequest):
    """
    Run a backtest for a given ticker and strategy.
    """
    try:
        # 1. Fetch historical data (use max available or a long period for backtesting)
        df = YFinanceProvider.get_historical_prices(request.ticker, period="5y")
        
        if df.empty:
            raise HTTPException(status_code=404, detail=f"Could not fetch historical data for {request.ticker}")
            
        # Ensure index is datetime for pandas rolling and date calculations if not already
        if 'date' in df.columns:
            import pandas as pd
            df['date'] = pd.to_datetime(df['date'])
            df = df.set_index('date')
            
        # 2. Run requested strategy
        if request.strategy == "sma_crossover":
            short_window = int(request.params.get("short_window", 20))
            long_window = int(request.params.get("long_window", 50))
            result = BacktestEngine.run_sma_crossover(df, short_window=short_window, long_window=long_window)
        elif request.strategy == "mean_reversion":
            window = int(request.params.get("window", 20))
            num_std = float(request.params.get("num_std", 2.0))
            result = BacktestEngine.run_mean_reversion(df, window=window, num_std=num_std)
        else:
            raise HTTPException(status_code=400, detail=f"Unknown strategy: {request.strategy}")
            
        return {
            "status": "success",
            "data": result
        }
        
    except Exception as e:
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
