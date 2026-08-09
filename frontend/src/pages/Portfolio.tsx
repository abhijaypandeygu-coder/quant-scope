import { useState } from "react";
import { usePortfolio } from "../hooks/usePortfolio";
import { Trash2, RefreshCw } from "lucide-react";

export function Portfolio() {
  const { portfolio, removeAsset, savePortfolio, normalizeWeights } = usePortfolio();
  const [newTicker, setNewTicker] = useState("");
  const [newWeight, setNewWeight] = useState("0.1");

  const handleUpdateWeight = (ticker: string, weightStr: string) => {
    const val = parseFloat(weightStr);
    if (isNaN(val)) return;
    
    const updated = portfolio.map(a => a.ticker === ticker ? { ...a, weight: val } : a);
    savePortfolio(updated);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicker.trim()) return;
    const val = parseFloat(newWeight) || 0.1;
    
    const upperTicker = newTicker.trim().toUpperCase();
    if (portfolio.find(a => a.ticker === upperTicker)) return;

    savePortfolio([...portfolio, { ticker: upperTicker, weight: val }]);
    setNewTicker("");
  };

  const totalWeight = portfolio.reduce((sum, a) => sum + a.weight, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Portfolio Management</h2>
        <p className="text-muted-foreground mt-2">
          Manage your institutional portfolio holdings and capital allocation.
        </p>
      </div>

      <div className="bg-card border border-white/10 rounded-xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h3 className="font-semibold text-xl">Current Holdings</h3>
          <div className="flex items-center gap-4">
            <div className={`text-sm font-medium px-3 py-1 rounded-full ${Math.abs(totalWeight - 1.0) < 0.01 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              Total Weight: {(totalWeight * 100).toFixed(1)}%
            </div>
            <button 
              onClick={normalizeWeights}
              className="flex items-center gap-2 text-sm bg-accent hover:bg-accent/80 px-3 py-1.5 rounded-md transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Normalize to 100%
            </button>
          </div>
        </div>
        
        <div className="p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-3 font-medium text-muted-foreground">Asset</th>
                <th className="px-6 py-3 font-medium text-muted-foreground">Allocation (%)</th>
                <th className="px-6 py-3 font-medium text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {portfolio.map((asset) => (
                <tr key={asset.ticker} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-semibold">{asset.ticker}</td>
                  <td className="px-6 py-4">
                    <input 
                      type="number" 
                      step="0.01"
                      min="0"
                      value={asset.weight}
                      onChange={(e) => handleUpdateWeight(asset.ticker, e.target.value)}
                      className="bg-black/40 border border-white/10 rounded px-3 py-1.5 w-32 focus:outline-none focus:border-primary"
                    />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => removeAsset(asset.ticker)}
                      className="text-muted-foreground hover:text-destructive p-2 rounded-md hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {portfolio.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">
                    No assets in portfolio. Add one below.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-card border border-white/10 rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-lg mb-4">Add Asset</h3>
        <form onSubmit={handleAdd} className="flex gap-4">
          <input
            type="text"
            placeholder="Ticker (e.g. TSLA)"
            value={newTicker}
            onChange={(e) => setNewTicker(e.target.value)}
            className="flex-1 bg-black/40 border border-white/10 rounded px-4 py-2 focus:outline-none focus:border-primary"
            required
          />
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Weight (0.1 = 10%)"
            value={newWeight}
            onChange={(e) => setNewWeight(e.target.value)}
            className="w-48 bg-black/40 border border-white/10 rounded px-4 py-2 focus:outline-none focus:border-primary"
            required
          />
          <button 
            type="submit"
            className="bg-primary text-primary-foreground font-medium px-6 py-2 rounded hover:opacity-90 transition-opacity"
          >
            Add to Portfolio
          </button>
        </form>
      </div>
    </div>
  );
}
