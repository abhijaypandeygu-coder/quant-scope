import { useState, useEffect } from "react";
import { usePinnedAssets } from "../hooks/usePinnedAssets";
import { AssetCard } from "../components/market/AssetCard";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export function Dashboard() {
  const { pinnedAssets } = usePinnedAssets();
  const [movers, setMovers] = useState<{gainers: any[], losers: any[], actives: any[]} | null>(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/market/movers')
      .then(res => res.json())
      .then(res => setMovers(res))
      .catch(console.error);
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
        <p className="text-muted-foreground mt-2">
          Welcome to QuantScope. Select an asset or search to view the terminal.
        </p>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-xl font-semibold border-b border-white/10 pb-2">Pinned Assets</h3>
        {pinnedAssets.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center border border-dashed border-white/20 rounded-xl">
            You haven't pinned any assets yet. Search for a company and click the pin icon!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {pinnedAssets.map((ticker) => (
              <AssetCard key={ticker} ticker={ticker} />
            ))}
          </div>
        )}
      </div>

      {movers && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
          {/* Most Active */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold border-b border-white/10 pb-2">Most active</h3>
            <div className="space-y-3">
              {movers.actives.map((m, i) => (
                <div key={i} className="flex justify-between items-center cursor-pointer hover:bg-white/5 p-2 rounded-lg -mx-2 transition-colors" onClick={() => window.location.href = `/market/${m.ticker}`}>
                  <div>
                    <p className="font-semibold">{m.ticker}</p>
                    <p className="text-sm text-muted-foreground truncate w-40">{m.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono">${m.price.toFixed(2)}</p>
                    <p className={`text-sm flex items-center justify-end gap-1 ${m.change >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {m.change >= 0 ? "+" : ""}{m.change.toFixed(2)}%
                      {m.change >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gainers */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold border-b border-white/10 pb-2">Daily gainers</h3>
            <div className="space-y-3">
              {movers.gainers.map((m, i) => (
                <div key={i} className="flex justify-between items-center cursor-pointer hover:bg-white/5 p-2 rounded-lg -mx-2 transition-colors" onClick={() => window.location.href = `/market/${m.ticker}`}>
                  <div>
                    <p className="font-semibold">{m.ticker}</p>
                    <p className="text-sm text-muted-foreground truncate w-40">{m.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono">${m.price.toFixed(2)}</p>
                    <p className={`text-sm flex items-center justify-end gap-1 text-green-500`}>
                      +{m.change.toFixed(2)}%
                      <ArrowUpRight className="w-4 h-4" />
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Losers */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold border-b border-white/10 pb-2">Daily losers</h3>
            <div className="space-y-3">
              {movers.losers.map((m, i) => (
                <div key={i} className="flex justify-between items-center cursor-pointer hover:bg-white/5 p-2 rounded-lg -mx-2 transition-colors" onClick={() => window.location.href = `/market/${m.ticker}`}>
                  <div>
                    <p className="font-semibold">{m.ticker}</p>
                    <p className="text-sm text-muted-foreground truncate w-40">{m.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono">${m.price.toFixed(2)}</p>
                    <p className={`text-sm flex items-center justify-end gap-1 text-red-500`}>
                      {m.change.toFixed(2)}%
                      <ArrowDownRight className="w-4 h-4" />
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
