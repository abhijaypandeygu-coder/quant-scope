import os
import random
import time
import json
from typing import Dict, Any, List
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv()

# Configure Gemini API
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

class AIFinancialAnalyst:
    """
    Financial Analyst agent powered by Google Gemini.
    """
    
    @staticmethod
    def _get_model():
        # Fallback if no API key is provided, though we expect one now
        if not api_key:
            raise ValueError("GEMINI_API_KEY is missing from environment variables.")
        return genai.GenerativeModel('gemini-3.5-flash')
    
    @staticmethod
    def analyze_news_sentiment(ticker: str, news_articles: List[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Analyzes news articles for a given ticker and returns an aggregate sentiment using Gemini.
        """
        if not news_articles:
            news_text = f"No recent news found for {ticker}."
        else:
            news_text = "\n".join([f"- {article.get('title', '')}: {article.get('summary', '')}" for article in news_articles[:5]])
            
        prompt = f"""
        You are a senior quantitative financial analyst. 
        Analyze the following recent news headlines for {ticker} and provide a market sentiment score.
        
        News:
        {news_text}
        
        Respond ONLY with a raw JSON object (no markdown formatting, no code blocks) with the following structure:
        {{
            "sentiment_score": (float between -1.0 for very bearish and 1.0 for very bullish),
            "sentiment_label": (string: "Bullish", "Bearish", or "Neutral"),
            "ai_summary": (string: 2-3 sentences summarizing the key news drivers and potential impact on {ticker})
        }}
        """
        
        try:
            model = AIFinancialAnalyst._get_model()
            response = model.generate_content(prompt)
            # Try to parse JSON from the response text
            text = response.text.strip()
            if text.startswith("```json"):
                text = text[7:-3].strip()
            elif text.startswith("```"):
                text = text[3:-3].strip()
                
            result = json.loads(text)
            
            return {
                "ticker": ticker.upper(),
                "sentiment_score": result.get("sentiment_score", 0.0),
                "sentiment_label": result.get("sentiment_label", "Neutral"),
                "ai_summary": result.get("ai_summary", "Unable to generate summary."),
                "article_count": len(news_articles) if news_articles else 0
            }
        except Exception as e:
            print(f"Error analyzing sentiment: {e}")
            return {
                "ticker": ticker.upper(),
                "sentiment_score": 0.0,
                "sentiment_label": "Neutral",
                "ai_summary": f"Failed to analyze sentiment due to API error: {str(e)}",
                "article_count": len(news_articles) if news_articles else 0
            }

    @staticmethod
    def analyze_sec_filing(ticker: str, doc_type: str = "10-K") -> Dict[str, Any]:
        """
        Generates a simulated parsing and summary of an SEC filing using Gemini.
        """
        prompt = f"""
        You are a senior fundamental equities analyst.
        I want you to simulate an analysis of the most recent {doc_type} SEC filing for {ticker}.
        Based on your knowledge of {ticker}'s business model, industry, and macroeconomic factors, 
        what would be the likely key risks and opportunities highlighted in their {doc_type}?
        
        Respond ONLY with a raw JSON object (no markdown formatting, no code blocks) with the following structure:
        {{
            "key_risks": [(list of 2-3 short strings describing major risks)],
            "key_opportunities": [(list of 2-3 short strings describing growth opportunities)],
            "executive_summary": (string: 2-3 sentences summarizing the overall financial and strategic position)
        }}
        """
        
        try:
            model = AIFinancialAnalyst._get_model()
            response = model.generate_content(prompt)
            
            text = response.text.strip()
            if text.startswith("```json"):
                text = text[7:-3].strip()
            elif text.startswith("```"):
                text = text[3:-3].strip()
                
            result = json.loads(text)
            
            return {
                "ticker": ticker.upper(),
                "document_type": doc_type,
                "filing_date": "Recent",
                "key_risks": result.get("key_risks", []),
                "key_opportunities": result.get("key_opportunities", []),
                "executive_summary": result.get("executive_summary", "Unable to generate summary.")
            }
        except Exception as e:
            print(f"Error parsing SEC filing: {e}")
            return {
                "ticker": ticker.upper(),
                "document_type": doc_type,
                "filing_date": "Unknown",
                "key_risks": ["Error analyzing filing"],
                "key_opportunities": ["Error analyzing filing"],
                "executive_summary": f"Failed to analyze SEC filing due to API error: {str(e)}"
            }

    @staticmethod
    def chat_with_data(query: str, context_data: Dict[str, Any] = None) -> str:
        """
        RAG pipeline response using Google Gemini.
        """
        prompt = f"""
        You are 'QuantScope AI', a highly sophisticated, professional quantitative financial analyst and hedge fund assistant.
        Your goal is to answer the user's financial question accurately and concisely, using a professional tone.
        
        Context (if any):
        {json.dumps(context_data) if context_data else "No specific portfolio/market context provided."}
        
        User Query:
        {query}
        
        Respond clearly, concisely, and professionally. Do not include markdown formatting if unnecessary, just plain text or simple bullet points.
        """
        
        try:
            model = AIFinancialAnalyst._get_model()
            response = model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            print(f"Error in chat generation: {e}")
            return f"I apologize, but I encountered an error connecting to my language model: {str(e)}"
