from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from data_providers.yfinance_provider import YFinanceProvider
from core.microstructure import (
    generate_synthetic_order_book, 
    calculate_imbalance, 
    calculate_microprice,
    generate_tape,
    estimate_vpin,
    get_flow_metrics,
    estimate_slippage
)

router = APIRouter()

@router.get("/{ticker}")
async def get_microstructure_data(ticker: str):
    """
    Returns synthetic Level-2 order book data and microstructure analytics for a given ticker.
    """
    try:
        # Get latest price to use as mid-price for our synthetic order book
        df = YFinanceProvider.get_historical_prices(ticker, period="1d")
        if df.empty:
            raise HTTPException(status_code=404, detail="Could not fetch price data for ticker")
            
        current_price = df.iloc[-1]['close']
        
        # Generate synthetic order book
        order_book = generate_synthetic_order_book(current_price, levels=10, spread_bps=2.0)
        bids = order_book["bids"]
        asks = order_book["asks"]
        
        # Calculate analytics
        imbalance = calculate_imbalance(bids, asks, levels=5)
        microprice = calculate_microprice(bids, asks)
        vpin = estimate_vpin(bids, asks)
        flow_metrics = get_flow_metrics()
        tape = generate_tape(current_price, count=25)
        
        return {
            "ticker": ticker.upper(),
            "mid_price": order_book["mid_price"],
            "spread": order_book["spread"],
            "bids": bids,
            "asks": asks,
            "imbalance": round(imbalance, 4),
            "microprice": round(microprice, 4),
            "vpin": vpin,
            "cancel_to_fill": flow_metrics["cancel_to_fill"],
            "spread_volatility": flow_metrics["spread_volatility"],
            "tape": tape,
            "is_simulated": True
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

class SlippageRequest(BaseModel):
    ticker: str
    order_size_usd: float
    side: str

@router.post("/slippage")
async def calculate_slippage(request: SlippageRequest):
    """
    Calculates estimated slippage for a market order based on current synthetic order book.
    """
    try:
        # Get latest price to generate the book
        df = YFinanceProvider.get_historical_prices(request.ticker, period="1d")
        if df.empty:
            raise HTTPException(status_code=404, detail="Could not fetch price data for ticker")
            
        current_price = df.iloc[-1]['close']
        
        # Generate synthetic order book (using more levels for larger orders)
        order_book = generate_synthetic_order_book(current_price, levels=20, spread_bps=2.0)
        
        slippage_bps = estimate_slippage(request.order_size_usd, request.side, order_book)
        
        return {
            "ticker": request.ticker.upper(),
            "order_size_usd": request.order_size_usd,
            "side": request.side,
            "slippage_bps": slippage_bps
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")
