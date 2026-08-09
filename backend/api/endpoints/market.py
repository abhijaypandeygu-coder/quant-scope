from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any
from data_providers.yfinance_provider import YFinanceProvider
from core.technical import add_technical_indicators

router = APIRouter()

MOCK_ASSETS = [
    {"ticker": "AAPL", "name": "Apple Inc.", "sector": "Technology"},
    {"ticker": "MSFT", "name": "Microsoft Corp.", "sector": "Technology"},
    {"ticker": "NVDA", "name": "NVIDIA Corp.", "sector": "Technology"},
    {"ticker": "GOOGL", "name": "Alphabet Inc.", "sector": "Technology"},
    {"ticker": "AMZN", "name": "Amazon.com Inc.", "sector": "Consumer Cyclical"},
    {"ticker": "TSLA", "name": "Tesla Inc.", "sector": "Consumer Cyclical"},
    {"ticker": "JPM", "name": "JPMorgan Chase & Co.", "sector": "Financial Services"},
]

@router.get("/assets", response_model=List[Dict[str, Any]])
def get_assets():
    """Return a list of popular assets for the dashboard"""
    return MOCK_ASSETS

@router.get("/search")
def search_assets(q: str = Query(..., min_length=1)):
    """Search for assets by ticker or name using Yahoo Finance"""
    # First search local mock assets to ensure they always show up fast if matched
    q_lower = q.lower()
    local_results = [
        asset for asset in MOCK_ASSETS 
        if q_lower in asset["ticker"].lower() or q_lower in asset["name"].lower()
    ]
    
    # Then query real API
    live_results = YFinanceProvider.search_tickers(q)
    
    # Merge and deduplicate
    seen_tickers = set([a["ticker"] for a in local_results])
    merged = list(local_results)
    for res in live_results:
        if res["ticker"] not in seen_tickers:
            merged.append(res)
            seen_tickers.add(res["ticker"])
            
    return merged[:10]

@router.get("/prices/{ticker}")
def get_prices(ticker: str, period: str = "1y", indicators: bool = True):
    """Return historical prices for a given ticker, optionally with technical indicators"""
    try:
        df = YFinanceProvider.get_historical_prices(ticker, period=period)
        if df.empty:
            raise HTTPException(status_code=404, detail=f"No price data found for {ticker}")
            
        if indicators:
            df = add_technical_indicators(df)
            
        return {
            "ticker": ticker.upper(),
            "data": df.to_dict(orient="records")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/fundamentals/{ticker}")
def get_fundamentals(ticker: str):
    """Return fundamental data for a given ticker"""
    try:
        data = YFinanceProvider.get_fundamentals(ticker)
        return {"ticker": ticker.upper(), "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/news/{ticker}")
def get_news(ticker: str):
    """Return news for a given ticker"""
    try:
        news = YFinanceProvider.get_news(ticker)
        return {"ticker": ticker.upper(), "news": news}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/related/{ticker}")
def get_related(ticker: str):
    """Return related stocks and their current performance"""
    try:
        import random
        # Just pick 4 random mock assets that are not the current ticker
        candidates = [a["ticker"] for a in MOCK_ASSETS if a["ticker"].upper() != ticker.upper()]
        selected = random.sample(candidates, min(4, len(candidates)))
        
        results = []
        for t in selected:
            # fetch a short period to get current price and change
            df = YFinanceProvider.get_historical_prices(t, period="5d")
            if len(df) >= 2:
                current_price = df.iloc[-1]["close"]
                prev_price = df.iloc[-2]["close"]
                pct_change = ((current_price - prev_price) / prev_price) * 100
                results.append({
                    "ticker": t,
                    "price": round(current_price, 2),
                    "change": round(pct_change, 2),
                    # Send last 5 days for a tiny sparkline if needed
                    "history": df["close"].tolist()
                })
        return {"ticker": ticker.upper(), "related": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/movers")
def get_market_movers():
    """Return top gainers, losers, and most active stocks"""
    try:
        gainers = YFinanceProvider.get_market_movers("day_gainers", 4)
        losers = YFinanceProvider.get_market_movers("day_losers", 4)
        actives = YFinanceProvider.get_market_movers("most_actives", 4)
        
        return {
            "gainers": gainers,
            "losers": losers,
            "actives": actives
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
