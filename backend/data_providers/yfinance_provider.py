import yfinance as yf
import pandas as pd
import requests
from typing import Dict, Any, List

class YFinanceProvider:
    @staticmethod
    def get_historical_prices(ticker: str, period: str = "1mo") -> pd.DataFrame:
        """
        Fetch historical prices for a ticker.
        Periods: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max
        """
        stock = yf.Ticker(ticker)
        df = stock.history(period=period)
        
        if df.empty:
            return pd.DataFrame()
            
        df = df.reset_index()
        # Ensure column names are lowercase
        df.columns = [c.lower() for c in df.columns]
        # Rename 'date' or 'datetime' to 'date' and convert to string
        if 'datetime' in df.columns:
            df = df.rename(columns={'datetime': 'date'})
        df['date'] = df['date'].dt.strftime('%Y-%m-%d')
        
        return df[['date', 'open', 'high', 'low', 'close', 'volume']]

    @staticmethod
    def get_fundamentals(ticker: str) -> Dict[str, Any]:
        """
        Fetch basic fundamental data for a ticker.
        """
        stock = yf.Ticker(ticker)
        info = stock.info
        
        return {
            "name": info.get("shortName", ticker),
            "sector": info.get("sector", "N/A"),
            "industry": info.get("industry", "N/A"),
            "currency": info.get("currency", "USD"),
            "market_cap": info.get("marketCap", None),
            
            # Valuation
            "pe_ratio": info.get("trailingPE", None),
            "forward_pe": info.get("forwardPE", None),
            "pb_ratio": info.get("priceToBook", None),
            "ev_ebitda": info.get("enterpriseToEbitda", None),
            
            # Profitability
            "profit_margin": info.get("profitMargins", None),
            "operating_margin": info.get("operatingMargins", None),
            "roe": info.get("returnOnEquity", None),
            "roa": info.get("returnOnAssets", None),
            
            # Health
            "debt_to_equity": info.get("debtToEquity", None),
            "current_ratio": info.get("currentRatio", None),
            "quick_ratio": info.get("quickRatio", None),
            
            # Growth
            "revenue_growth": info.get("revenueGrowth", None),
            "earnings_growth": info.get("earningsGrowth", None)
        }

    @staticmethod
    def search_tickers(query: str) -> List[Dict[str, str]]:
        """
        Search for tickers using Yahoo Finance's public search API.
        """
        url = f"https://query2.finance.yahoo.com/v1/finance/search?q={query}"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        try:
            response = requests.get(url, headers=headers, timeout=5)
            response.raise_for_status()
            data = response.json()
            quotes = data.get("quotes", [])
            
            results = []
            for quote in quotes:
                # We only want equities and ETFs, not mutual funds or cryptos if possible, 
                # but we'll return anything with a valid symbol
                if "symbol" in quote and "shortname" in quote:
                    results.append({
                        "ticker": quote["symbol"],
                        "name": quote["shortname"],
                        "sector": quote.get("quoteType", "Equity")
                    })
            return results[:10]  # Return top 10 results
        except Exception as e:
            print(f"Search API error: {e}")
    @staticmethod
    def get_news(ticker: str) -> List[Dict[str, Any]]:
        """
        Fetch latest news for a ticker.
        """
        try:
            stock = yf.Ticker(ticker)
            news = stock.news
            
            results = []
            for item in news:
                results.append({
                    "title": item.get("title", ""),
                    "publisher": item.get("publisher", ""),
                    "link": item.get("link", ""),
                    "publish_time": item.get("providerPublishTime", 0)
                })
            return results
        except Exception as e:
            print(f"News API error: {e}")
    @staticmethod
    def get_market_movers(scr_id: str = "day_gainers", count: int = 4) -> List[Dict[str, Any]]:
        """
        Fetch market movers from Yahoo Finance.
        Valid scr_ids: day_gainers, day_losers, most_actives
        """
        url = f"https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?formatted=false&lang=en-US&region=US&scrIds={scr_id}&count={count}"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        try:
            response = requests.get(url, headers=headers, timeout=5)
            response.raise_for_status()
            data = response.json()
            quotes = data.get("finance", {}).get("result", [])[0].get("quotes", [])
            
            results = []
            for q in quotes:
                results.append({
                    "ticker": q.get("symbol", ""),
                    "name": q.get("shortName", q.get("longName", "")),
                    "price": q.get("regularMarketPrice", 0.0),
                    "change": q.get("regularMarketChangePercent", 0.0)
                })
            return results
        except Exception as e:
            print(f"Market Movers API error: {e}")
            return []
