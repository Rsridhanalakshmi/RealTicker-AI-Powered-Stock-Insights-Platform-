import os
import json
import datetime
import pandas as pd
import yfinance as yf
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import httpx
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="RealTicker API")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

HF_TOKEN = os.getenv("HF_TOKEN")
HF_API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3"

TOP_10_TICKERS = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA", "META", "BRK-B", "V", "JNJ"]

class StockInfo(BaseModel):
    ticker: str
    name: str
    price: float
    change_percent: float
    volume: str

class AnalysisResult(BaseModel):
    trend: str
    risk_level: str
    suggested_action: str
    reasoning: str

@app.get("/api/stocks/top10", response_model=List[StockInfo])
async def get_top_10():
    try:
        stocks = []
        for ticker in TOP_10_TICKERS:
            tk = yf.Ticker(ticker)
            info = tk.info
            
            # Use info.get to handle missing keys gracefully
            price = info.get("currentPrice") or info.get("regularMarketPrice") or 0.0
            prev_close = info.get("previousClose") or 0.0
            change_percent = ((price - prev_close) / prev_close * 100) if prev_close != 0 else 0.0
            volume = info.get("volume", 0)
            
            # Format volume
            if volume >= 1_000_000_000:
                volume_str = f"{volume / 1_000_000_000:.1f}B"
            elif volume >= 1_000_000:
                volume_str = f"{volume / 1_000_000:.1f}M"
            else:
                volume_str = f"{volume / 1000:.1f}K"

            stocks.append(StockInfo(
                ticker=ticker,
                name=info.get("longName", ticker),
                price=round(price, 2),
                change_percent=round(change_percent, 2),
                volume=volume_str
            ))
        return stocks
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stocks/{ticker}/history")
async def get_history(ticker: str):
    try:
        tk = yf.Ticker(ticker)
        # Fetch 6 months of historical data
        history = tk.history(period="6mo")
        if history.empty:
            raise HTTPException(status_code=404, detail="No history found")
        
        # Format for frontend chart
        data = []
        for date, row in history.iterrows():
            data.append({
                "date": date.strftime("%Y-%m-%d"),
                "close": round(row["Close"], 2),
                "volume": int(row["Volume"])
            })
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/stocks/{ticker}/analyze", response_model=AnalysisResult)
async def analyze_stock(ticker: str):
    is_placeholder = not HF_TOKEN or "your_huggingface_token_here" in HF_TOKEN
    
    if is_placeholder:
        # Fallback for demo if no token is provided or it's a placeholder
        return AnalysisResult(
            trend="Bullish (Mock)",
            risk_level="Medium (Mock)",
            suggested_action="Hold/Buy on Dips (Mock)",
            reasoning="Valid HF_TOKEN not detected in backend/.env. This is generated mock data based on recent price trends. For live AI analysis, please provide a HuggingFace Inference API token."
        )

    try:
        tk = yf.Ticker(ticker)
        history = tk.history(period="6mo")
        if history.empty:
            raise HTTPException(status_code=404, detail="No history found")

        # Prepare summary for prompt
        prices = history["Close"].tolist()
        summary_data = {
            "ticker": ticker,
            "start_price": round(prices[0], 2),
            "end_price": round(prices[-1], 2),
            "high": round(max(prices), 2),
            "low": round(min(prices), 2),
            "last_10_days": [round(p, 2) for p in prices[-10:]]
        }

        prompt = f"Analyze the following 6 months stock price data for {ticker}. Identify trend, volatility, and provide investment guidance for a beginner.\n"
        prompt += f"Summary Statistics: Start Price: {summary_data['start_price']}, End Price: {summary_data['end_price']}, High: {summary_data['high']}, Low: {summary_data['low']}.\n"
        prompt += f"Recent 10 days closings: {summary_data['last_10_days']}\n\n"
        prompt += "Respond ONLY in JSON format with keys: trend, risk_level, suggested_action, reasoning.\n"
        prompt += "trend should be one of: Upward, Downward, Sideways.\n"
        prompt += "risk_level should be one of: Low, Medium, High.\n"
        prompt += "suggested_action should be one of: Long-term investment, Short-term watch, Avoid (with reason)."

        headers = {"Authorization": f"Bearer {HF_TOKEN}"}
        async with httpx.AsyncClient() as client:
            response = await client.post(
                HF_API_URL,
                headers=headers,
                json={"inputs": prompt, "parameters": {"return_full_text": False}}
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="HF API error")
            
            result_text = response.json()[0].get("generated_text", "")
            
            # Extract JSON from response
            try:
                # Find valid JSON boundaries
                json_start = result_text.find("{")
                json_end = result_text.rfind("}") + 1
                
                if json_start != -1 and json_end > json_start:
                    json_str = result_text[json_start:json_end]
                    json_data = json.loads(json_str)
                    
                    # Basic validation and sanitization
                    return AnalysisResult(
                        trend=str(json_data.get("trend", "Manual Review Required")),
                        risk_level=str(json_data.get("risk_level", "Medium")),
                        suggested_action=str(json_data.get("suggested_action", "Consult Financial Advisor")),
                        reasoning=str(json_data.get("reasoning", "Analysis completed but reasoning was not clearly provided."))
                    )
                else:
                    raise ValueError("AI did not produce valid JSON")
            except Exception as e:
                return AnalysisResult(
                    trend="Inconclusive",
                    risk_level="Unknown",
                    suggested_action="N/A",
                    reasoning=f"Format error in AI output. Raw snippet: {result_text[:150]}"
                )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
