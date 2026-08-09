from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
from core.ai_agent import AIFinancialAnalyst
from data_providers.yfinance_provider import YFinanceProvider

router = APIRouter()

@router.get("/sentiment/{ticker}")
async def get_sentiment(ticker: str):
    """
    Returns AI-analyzed sentiment for a given ticker's recent news.
    """
    try:
        # Fetch news from yfinance
        news = YFinanceProvider.get_news(ticker)
        
        # Analyze sentiment
        analysis = AIFinancialAnalyst.analyze_news_sentiment(ticker, news)
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@router.get("/sec/{ticker}")
async def get_sec_analysis(ticker: str, doc_type: str = "10-K"):
    """
    Returns an AI summary of a company's recent SEC filing.
    """
    try:
        analysis = AIFinancialAnalyst.analyze_sec_filing(ticker, doc_type)
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

class ChatRequest(BaseModel):
    query: str
    context: Optional[Dict[str, Any]] = None

@router.post("/chat")
async def chat(request: ChatRequest):
    """
    Endpoint for the AI Analyst chat interface.
    """
    try:
        response = AIFinancialAnalyst.chat_with_data(request.query, request.context)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")
