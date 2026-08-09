import { useState, useEffect } from "react";
import { Search, AlertTriangle, Layers, Activity, ActivitySquare } from "lucide-react";

interface Order {
  price: number;
  size: number;
}

interface TapeItem {
  price: number;
  size: number;
  side: string;
  timestamp: number;
}

interface MicrostructureData {
  ticker: string;
  mid_price: number;
  spread: number;
  bids: Order[];
  asks: Order[];
  imbalance: number;
  microprice: number;
  vpin: number;
  cancel_to_fill: number;
  spread_volatility: number;
  tape: TapeItem[];
  is_simulated: boolean;
}

export function Microstructure() {
  const [ticker, setTicker] = useState("AAPL");
  const [data, setData] = useState<MicrostructureData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Slippage Calculator State
  const [slippageOrderSize, setSlippageOrderSize] = useState<number>(100000);
  const [slippageSide, setSlippageSide] = useState<"buy" | "sell">("buy");
  const [slippageBps, setSlippageBps] = useState<number | null>(null);
  const [calculatingSlippage, setCalculatingSlippage] = useState(false);

  const calculateSlippage = async () => {
    if (!ticker) return;
    setCalculatingSlippage(true);
    try {
      const res = await fetch(`http://localhost:8000/api/microstructure/slippage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker, order_size_usd: slippageOrderSize, side: slippageSide })
      });
      const json = await res.json();
      setSlippageBps(json.slippage_bps);
    } catch (e) {
      console.error(e);
    } finally {
      setCalculatingSlippage(false);
    }
  };

  const fetchMicrostructure = async (targetTicker: string) => {
    if (!targetTicker.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:8000/api/microstructure/${targetTicker}`);
      if (!res.ok) throw new Error("Failed to fetch order book data");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMicrostructure(ticker);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMicrostructure(ticker);
  };

  // Calculate max volume for depth bars
  const maxBidVol = data ? Math.max(...data.bids.map(b => b.size)) : 0;
  const maxAskVol = data ? Math.max(...data.asks.map(a => a.size)) : 0;
  const maxVol = Math.max(maxBidVol, maxAskVol);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Layers className="w-8 h-8 text-primary" />
            Microstructure Lab
          </h2>
          <p className="text-muted-foreground mt-2">
            Level-2 order book visualization, liquidity analytics, and volume imbalance.
          </p>
        </div>
        
        {data?.is_simulated && (
          <div className="flex items-center gap-2 bg-yellow-500/10 text-yellow-500 px-4 py-2 rounded-lg border border-yellow-500/20">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-sm font-medium">SIMULATED LEVEL-2 DATA</span>
          </div>
        )}
      </div>

      <div className="bg-card border border-white/10 rounded-xl p-4 shadow-sm flex items-center justify-between">
        <form onSubmit={handleSearch} className="flex gap-4 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Ticker (e.g. AAPL)"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              className="pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-md focus:outline-none focus:border-primary w-64"
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? "Loading..." : "Load Order Book"}
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg">
          {error}
        </div>
      )}

      {data && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Analytics Column */}
          <div className="space-y-6 lg:col-span-1">
            <div className="bg-card border border-white/10 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Liquidity Metrics
              </h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Mid Price</p>
                  <p className="text-3xl font-bold">${data.mid_price.toFixed(2)}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                    <p className="text-xs text-muted-foreground mb-1">Spread</p>
                    <p className="text-lg font-mono">${data.spread.toFixed(4)}</p>
                  </div>
                  <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                    <p className="text-xs text-muted-foreground mb-1">Spread Vol</p>
                    <p className="text-lg font-mono">{data.spread_volatility} bps</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card border border-white/10 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ActivitySquare className="w-5 h-5 text-primary" />
                Order Flow & Toxicity
              </h3>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <p className="text-sm text-muted-foreground">Volume Imbalance</p>
                    <p className={`text-lg font-mono ${data.imbalance > 0 ? "text-green-400" : "text-red-400"}`}>
                      {data.imbalance > 0 ? "+" : ""}{(data.imbalance * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden flex">
                    <div className="h-full bg-green-500" style={{ width: `${Math.max(0, 50 + data.imbalance * 50)}%` }} />
                    <div className="h-full bg-red-500" style={{ width: `${Math.max(0, 50 - data.imbalance * 50)}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-2">
                    <p className="text-sm text-muted-foreground">VPIN (Toxicity)</p>
                    <p className={`text-lg font-mono ${data.vpin > 0.7 ? "text-red-400" : data.vpin > 0.4 ? "text-yellow-400" : "text-green-400"}`}>
                      {(data.vpin * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full ${data.vpin > 0.7 ? "bg-red-500" : data.vpin > 0.4 ? "bg-yellow-500" : "bg-green-500"}`} style={{ width: `${data.vpin * 100}%` }} />
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">Cancel-to-Fill</p>
                  <p className="text-xl font-mono">{data.cancel_to_fill}:1</p>
                </div>
                
                <div className="pt-4 border-t border-white/10">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">Microprice</p>
                    <p className="text-xl font-mono">${data.microprice.toFixed(3)}</p>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-muted-foreground">vs Mid Price</p>
                    <p className={`text-sm font-mono ${data.microprice > data.mid_price ? "text-green-400" : "text-red-400"}`}>
                      {data.microprice > data.mid_price ? "+" : ""}{(data.microprice - data.mid_price).toFixed(4)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Slippage Calculator */}
            <div className="bg-card border border-white/10 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Slippage Estimator</h3>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <button 
                    className={`flex-1 py-1.5 rounded-md text-sm font-medium ${slippageSide === "buy" ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-white/5 text-muted-foreground"}`}
                    onClick={() => setSlippageSide("buy")}
                  >Buy</button>
                  <button 
                    className={`flex-1 py-1.5 rounded-md text-sm font-medium ${slippageSide === "sell" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-white/5 text-muted-foreground"}`}
                    onClick={() => setSlippageSide("sell")}
                  >Sell</button>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Order Size (USD)</label>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      value={slippageOrderSize} 
                      onChange={(e) => setSlippageOrderSize(Number(e.target.value))}
                      className="flex-1 bg-black/40 border border-white/10 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-primary"
                    />
                    <button 
                      onClick={calculateSlippage}
                      disabled={calculatingSlippage}
                      className="bg-primary/20 text-primary px-3 py-1.5 rounded-md text-sm font-medium hover:bg-primary/30"
                    >Calc</button>
                  </div>
                </div>
                {slippageBps !== null && (
                  <div className="p-3 bg-black/30 rounded-lg border border-white/5 text-center mt-2">
                    <p className="text-xs text-muted-foreground">Est. Slippage</p>
                    <p className="text-xl font-mono mt-1 text-primary">{slippageBps} bps</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Visualization Column */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Depth Chart */}
            <div className="bg-card border border-white/10 rounded-xl p-4 shadow-sm h-48 flex items-end relative overflow-hidden">
              <h3 className="absolute top-4 left-4 text-sm font-semibold text-muted-foreground">Order Book Depth</h3>
              <svg className="w-full h-32" viewBox="0 0 100 100" preserveAspectRatio="none">
                {(() => {
                  // Build cumulative arrays
                  const cumBids = [];
                  let cB = 0;
                  for (const b of data.bids) { cB += b.size; cumBids.push(cB); }
                  
                  const cumAsks = [];
                  let cA = 0;
                  for (const a of data.asks) { cA += a.size; cumAsks.push(cA); }
                  
                  const maxCum = Math.max(cumBids[cumBids.length-1] || 0, cumAsks[cumAsks.length-1] || 0);
                  
                  // Bids polygon (left side, from 50 to 0)
                  const bidPoints = [[50, 100]];
                  cumBids.forEach((vol, i) => {
                    const x = 50 - (i / (data.bids.length || 1)) * 50;
                    const y = 100 - (vol / (maxCum || 1)) * 100;
                    bidPoints.push([x, y]);
                  });
                  bidPoints.push([0, 100]);
                  
                  // Asks polygon (right side, from 50 to 100)
                  const askPoints = [[50, 100]];
                  cumAsks.forEach((vol, i) => {
                    const x = 50 + (i / (data.asks.length || 1)) * 50;
                    const y = 100 - (vol / (maxCum || 1)) * 100;
                    askPoints.push([x, y]);
                  });
                  askPoints.push([100, 100]);

                  return (
                    <>
                      <polygon points={bidPoints.map(p => p.join(',')).join(' ')} fill="rgba(34, 197, 94, 0.2)" stroke="#22c55e" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                      <polygon points={askPoints.map(p => p.join(',')).join(' ')} fill="rgba(239, 68, 68, 0.2)" stroke="#ef4444" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                    </>
                  );
                })()}
              </svg>
            </div>

            {/* Grid for L2 and Tape */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Bids */}
              <div className="bg-card border border-white/10 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-green-500/10 border-b border-white/10 p-2 text-center">
                  <h3 className="font-semibold text-green-400 text-sm">BIDS (Buy)</h3>
                </div>
                <div className="p-0">
                  <table className="w-full text-right text-xs">
                    <thead className="text-muted-foreground border-b border-white/5">
                      <tr>
                        <th className="py-2 px-3 font-normal">Size</th>
                        <th className="py-2 px-3 font-normal">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.bids.map((bid, i) => (
                        <tr key={i} className="relative group hover:bg-white/5">
                          <td className="py-1 px-3 font-mono z-10 relative">{bid.size.toLocaleString()}</td>
                          <td className="py-1 px-3 font-mono text-green-400 z-10 relative">{bid.price.toFixed(2)}</td>
                          <td className="absolute inset-y-0 right-0 bg-green-500/10 z-0 transition-all" style={{ width: `${(bid.size / maxVol) * 100}%` }} />
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Asks */}
              <div className="bg-card border border-white/10 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-red-500/10 border-b border-white/10 p-2 text-center">
                  <h3 className="font-semibold text-red-400 text-sm">ASKS (Sell)</h3>
                </div>
                <div className="p-0">
                  <table className="w-full text-left text-xs">
                    <thead className="text-muted-foreground border-b border-white/5">
                      <tr>
                        <th className="py-2 px-3 font-normal">Price</th>
                        <th className="py-2 px-3 font-normal">Size</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.asks.map((ask, i) => (
                        <tr key={i} className="relative group hover:bg-white/5">
                          <td className="py-1 px-3 font-mono text-red-400 z-10 relative">{ask.price.toFixed(2)}</td>
                          <td className="py-1 px-3 font-mono z-10 relative">{ask.size.toLocaleString()}</td>
                          <td className="absolute inset-y-0 left-0 bg-red-500/10 z-0 transition-all" style={{ width: `${(ask.size / maxVol) * 100}%` }} />
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tape / Time & Sales */}
              <div className="bg-card border border-white/10 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-white/5 border-b border-white/10 p-2 text-center">
                  <h3 className="font-semibold text-sm">TIME & SALES</h3>
                </div>
                <div className="p-0 overflow-y-auto max-h-[300px]">
                  <table className="w-full text-right text-xs">
                    <thead className="text-muted-foreground border-b border-white/5">
                      <tr>
                        <th className="py-2 px-3 font-normal text-left">Time</th>
                        <th className="py-2 px-3 font-normal">Price</th>
                        <th className="py-2 px-3 font-normal">Size</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.tape.map((t, i) => {
                        const date = new Date(t.timestamp * 1000);
                        const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
                        return (
                          <tr key={i} className="hover:bg-white/5">
                            <td className="py-1 px-3 font-mono text-muted-foreground text-left">{timeStr}</td>
                            <td className={`py-1 px-3 font-mono ${t.side === "buy" ? "text-green-400" : "text-red-400"}`}>{t.price.toFixed(2)}</td>
                            <td className="py-1 px-3 font-mono">{t.size.toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
