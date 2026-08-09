import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export function MarketsOverview() {
  const [assets, setAssets] = useState<any[]>([]);

  useEffect(() => {
    // Fetch the mock assets we defined in the backend
    fetch("http://127.0.0.1:8000/api/market/assets")
      .then(res => res.json())
      .then(data => setAssets(data))
      .catch(console.error);
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Markets</h2>
        <p className="text-muted-foreground mt-2">
          Select an asset below to open its trading terminal, or use the search bar for any other ticker (e.g. AMD, META).
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {assets.map((asset) => (
          <Link key={asset.ticker} to={`/market/${asset.ticker}`}>
            <div className="border rounded-xl p-6 bg-card text-card-foreground shadow-sm hover:border-primary transition-colors cursor-pointer h-full">
              <h3 className="font-semibold text-lg">{asset.name}</h3>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-xl font-bold">{asset.ticker}</span>
                <span className="text-sm text-muted-foreground">{asset.sector}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
