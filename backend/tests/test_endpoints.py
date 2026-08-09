from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()

def test_health_check():
    response = client.get("/api/")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_market_prices_valid():
    response = client.get("/api/market/prices/AAPL?period=1d&indicators=false")
    assert response.status_code == 200
    data = response.json()
    assert "ticker" in data
    assert data["ticker"] == "AAPL"
    assert "data" in data
