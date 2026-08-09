from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List
import pandas as pd
from data_providers.yfinance_provider import YFinanceProvider
from core.risk import RiskEngine

router = APIRouter()

class PortfolioAsset(BaseModel):
    ticker: str
    weight: float

class PortfolioAnalysisRequest(BaseModel):
    assets: List[PortfolioAsset]

@router.post("/analyze")
def analyze_portfolio(request: PortfolioAnalysisRequest):
    if not request.assets:
        raise HTTPException(status_code=400, detail="Portfolio must contain at least one asset")
        
    weights = {asset.ticker.upper(): asset.weight for asset in request.assets}
    
    # Check if weights sum to ~1.0
    total_weight = sum(weights.values())
    if abs(total_weight - 1.0) > 0.01:
        raise HTTPException(status_code=400, detail=f"Weights must sum to 1.0, current sum is {total_weight}")

    # Fetch data
    dfs = []
    for ticker in weights.keys():
        df = YFinanceProvider.get_historical_prices(ticker, period="1y")
        if df.empty:
            continue
        # Ensure date is the index and we just keep 'close'
        df = df.set_index('date')[['close']]
        df.columns = [ticker]
        dfs.append(df)
        
    if not dfs:
        raise HTTPException(status_code=404, detail="Could not fetch data for any assets in the portfolio")

    # Merge all dataframes on date
    merged_df = pd.concat(dfs, axis=1).dropna()
    
    # Run risk engine
    analysis = RiskEngine.analyze_portfolio(merged_df, weights)
    
    return {
        "status": "success",
        "data": analysis
    }
