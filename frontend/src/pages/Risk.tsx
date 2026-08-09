import { useState, useEffect } from "react";
import { usePortfolio } from "../hooks/usePortfolio";

export function Risk() {
  const { portfolio } = usePortfolio();
  const [riskData, setRiskData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (portfolio.length === 0) return;

    setLoading(true);
    setError(null);

    fetch("http://127.0.0.1:8000/api/portfolio/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assets: portfolio })
    })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.detail || "Failed to analyze portfolio");
        return json;
      })
      .then(res => {
        if (res.status === "success") {
          setRiskData(res.data);
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [portfolio]);

  const totalWeight = portfolio.reduce((sum, a) => sum + a.weight, 0);

  if (portfolio.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-muted-foreground border border-dashed border-white/20 rounded-xl">
        Your portfolio is empty. Add assets in the Portfolio tab to view risk analytics.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Risk Analytics</h2>
        <p className="text-muted-foreground mt-2">
          Quantitative risk metrics and correlation mapping for your current holdings.
        </p>
      </div>
      
      {Math.abs(totalWeight - 1.0) > 0.01 && (
        <div className="bg-yellow-500/20 text-yellow-400 p-4 rounded-xl border border-yellow-500/30">
          Warning: Your portfolio weights sum to {(totalWeight * 100).toFixed(1)}%. Please normalize to 100% in the Portfolio tab for accurate risk modeling.
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-muted-foreground animate-pulse">Running Risk Engine...</div>
      ) : error ? (
        <div className="bg-red-500/20 text-red-400 p-4 rounded-xl border border-red-500/30">{error}</div>
      ) : riskData ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card border border-white/10 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">95% Daily VaR</h3>
              <div className="text-3xl font-bold text-red-500">
                {(riskData.metrics.var * 100).toFixed(2)}%
              </div>
              <p className="text-xs text-muted-foreground mt-2">Expected maximum loss on 95% of trading days.</p>
            </div>
            <div className="bg-card border border-white/10 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Annualized Volatility</h3>
              <div className="text-3xl font-bold">
                {(riskData.metrics.volatility * 100).toFixed(2)}%
              </div>
              <p className="text-xs text-muted-foreground mt-2">Standard deviation of yearly returns.</p>
            </div>
            <div className="bg-card border border-white/10 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Max Drawdown</h3>
              <div className="text-3xl font-bold text-red-500">
                {(riskData.metrics.max_drawdown * 100).toFixed(2)}%
              </div>
              <p className="text-xs text-muted-foreground mt-2">Largest peak-to-trough drop in history.</p>
            </div>
          </div>

          <div className="bg-card border border-white/10 rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-lg mb-6">Asset Correlation Matrix</h3>
            <div className="overflow-x-auto">
              {riskData.correlation && (
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="p-2 border border-white/10 bg-black/20"></th>
                      {Object.keys(riskData.correlation).map(ticker => (
                        <th key={ticker} className="p-2 border border-white/10 font-medium">{ticker}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(riskData.correlation).map(rowTicker => (
                      <tr key={rowTicker}>
                        <th className="p-2 border border-white/10 font-medium text-left">{rowTicker}</th>
                        {Object.keys(riskData.correlation).map(colTicker => {
                          const val = riskData.correlation[rowTicker][colTicker];
                          // Color mapping: >0 is green, <0 is red, magnitude dictates opacity
                          const isPositive = val >= 0;
                          const intensity = Math.abs(val);
                          const bgColor = isPositive ? `rgba(34, 197, 94, ${intensity * 0.5})` : `rgba(239, 68, 68, ${intensity * 0.5})`;
                          
                          return (
                            <td key={colTicker} className="p-3 border border-white/10 text-center font-mono text-sm" style={{ backgroundColor: bgColor }}>
                              {val.toFixed(2)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
