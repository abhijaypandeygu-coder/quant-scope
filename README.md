# QuantScope - Institutional Market Intelligence Terminal

QuantScope is a production-ready, full-stack quantitative finance platform designed for institutional market intelligence, algorithmic research, and portfolio analytics.

## Features

- **Market Overview:** Real-time asset tracking and technical indicators.
- **Microstructure Analytics:** Order book visualizations, VPIN estimators, and slippage calculators.
- **Portfolio Analytics:** Multi-asset portfolio tracking and risk modeling (Historical VaR, correlation matrices).
- **AI Financial Analyst:** Live RAG pipeline powered by Google Gemini to analyze SEC filings, sentiment, and provide quantitative insights.
- **Production-Ready:** Containerized with Docker, thoroughly tested with Pytest, and optimized with Gunicorn.

## Architecture

- **Backend:** Python, FastAPI, Uvicorn/Gunicorn, Pytest
- **Frontend:** React, TypeScript, TailwindCSS, Vite
- **Database:** PostgreSQL 15
- **Orchestration:** Docker Compose

## Quickstart (Development)

### Backend
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate  # Or source venv/bin/activate on Linux/Mac
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Production Deployment (Docker)

To spin up the entire stack in production mode (Nginx serving frontend, Gunicorn running backend, and Postgres DB):

1. Create a `.env` file in the `backend/` directory and add your `GEMINI_API_KEY`:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```
2. Build and start the containers:
   ```bash
   docker-compose up --build -d
   ```
3. Access the application at `http://localhost:3000`. The API runs at `http://localhost:8000/api`.

## Testing

Run the pytest suite to verify the backend core:
```bash
cd backend
pytest tests/
```
