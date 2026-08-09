from fastapi import APIRouter
from api.endpoints import health, market, portfolio, research, microstructure, ai

api_router = APIRouter()

api_router.include_router(health.router, tags=["health"])
api_router.include_router(market.router, prefix="/market", tags=["market"])
api_router.include_router(portfolio.router, prefix="/portfolio", tags=["portfolio"])
api_router.include_router(research.router, prefix="/research", tags=["research"])
api_router.include_router(microstructure.router, prefix="/microstructure", tags=["microstructure"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
