import { useState, useEffect } from "react";

export interface PortfolioAsset {
  ticker: string;
  weight: number;
}

export function usePortfolio() {
  const getPortfolio = (): PortfolioAsset[] => {
    try {
      const stored = localStorage.getItem("quantscope-portfolio");
      if (stored) return JSON.parse(stored);
      
      // Default portfolio
      return [
        { ticker: "AAPL", weight: 0.4 },
        { ticker: "MSFT", weight: 0.4 },
        { ticker: "NVDA", weight: 0.2 },
      ];
    } catch {
      return [];
    }
  };

  const [portfolio, setPortfolioState] = useState<PortfolioAsset[]>(getPortfolio());

  useEffect(() => {
    const handleStorageChange = () => {
      setPortfolioState(getPortfolio());
    };
    window.addEventListener("quantscope-portfolio-change", handleStorageChange);
    return () => window.removeEventListener("quantscope-portfolio-change", handleStorageChange);
  }, []);

  const savePortfolio = (newPortfolio: PortfolioAsset[]) => {
    localStorage.setItem("quantscope-portfolio", JSON.stringify(newPortfolio));
    setPortfolioState(newPortfolio);
    window.dispatchEvent(new Event("quantscope-portfolio-change"));
  };

  const addAsset = (ticker: string, weight: number) => {
    const current = getPortfolio();
    const existing = current.find(a => a.ticker === ticker);
    if (existing) {
      existing.weight = weight;
      savePortfolio([...current]);
    } else {
      savePortfolio([...current, { ticker, weight }]);
    }
  };

  const removeAsset = (ticker: string) => {
    const current = getPortfolio();
    savePortfolio(current.filter(a => a.ticker !== ticker));
  };

  const normalizeWeights = () => {
    const current = getPortfolio();
    const total = current.reduce((sum, asset) => sum + asset.weight, 0);
    if (total === 0) return;
    
    const normalized = current.map(asset => ({
      ...asset,
      weight: asset.weight / total
    }));
    savePortfolio(normalized);
  };

  return { portfolio, savePortfolio, addAsset, removeAsset, normalizeWeights };
}
