import { useState, useEffect } from "react";
import { Search, FileText, Loader2, DollarSign, Activity, Percent, TrendingUp } from "lucide-react";

export function Fundamentals() {
  const [ticker, setTicker] = useState("AAPL");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFundamentals = async (searchTicker: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:8000/api/market/fundamentals/${searchTicker}`);
      if (!res.ok) throw new Error("Failed to fetch fundamentals");
      const json = await res.json();
      setData(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFundamentals(ticker);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticker.trim()) fetchFundamentals(ticker.trim().toUpperCase());
  };

  const formatNumber = (num: number) => {
    if (!num) return "N/A";
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Fundamentals</h2>
          <p className="text-muted-foreground mt-2">Key metrics and financial ratios</p>
        </div>
        
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Enter ticker..." 
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              className="pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-lg focus:outline-none focus:border-primary/50 text-sm w-48"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 text-sm font-medium"
          >
            Search
          </button>
        </form>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 border border-white/10 rounded-xl bg-card">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="p-6 border border-red-500/30 bg-red-500/10 rounded-xl text-red-400">
          Error: {error}
        </div>
      ) : !data ? (
        <div className="p-12 border border-white/10 rounded-xl bg-card text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No fundamentals found for {ticker.toUpperCase()}.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="p-6 border border-white/10 rounded-xl bg-card">
            <h3 className="text-xl font-bold mb-1">{data.name || ticker.toUpperCase()}</h3>
            <p className="text-sm text-muted-foreground mb-6">{data.sector} • {data.industry}</p>
            <p className="text-sm leading-relaxed text-foreground/80">
              Data sourced from Yahoo Finance. This section provides an overview of the company's valuation, profitability, and balance sheet metrics.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 border border-white/10 rounded-xl bg-card flex items-start gap-4">
              <div className="p-2 bg-primary/20 rounded-lg">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Market Cap</p>
                <p className="text-lg font-bold">{formatNumber(data.market_cap)}</p>
              </div>
            </div>
            
            <div className="p-5 border border-white/10 rounded-xl bg-card flex items-start gap-4">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Activity className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Currency</p>
                <p className="text-lg font-bold">{data.currency || "USD"}</p>
              </div>
            </div>

            <div className="p-5 border border-white/10 rounded-xl bg-card flex items-start gap-4">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Trailing P/E</p>
                <p className="text-lg font-bold">{data.pe_ratio?.toFixed(2) || "N/A"}</p>
              </div>
            </div>

            <div className="p-5 border border-white/10 rounded-xl bg-card flex items-start gap-4">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Percent className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Revenue Growth</p>
                <p className="text-lg font-bold">{data.revenue_growth ? (data.revenue_growth * 100).toFixed(2) + "%" : "N/A"}</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 border border-white/10 rounded-xl bg-card">
              <h4 className="font-semibold mb-4 border-b border-white/10 pb-2">Valuation Measures</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Forward P/E</span><span>{data.forward_pe?.toFixed(2) || "N/A"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Price/Book (mrq)</span><span>{data.pb_ratio?.toFixed(2) || "N/A"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Enterprise Value/EBITDA</span><span>{data.ev_ebitda?.toFixed(2) || "N/A"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Debt to Equity</span><span>{data.debt_to_equity?.toFixed(2) || "N/A"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Current Ratio</span><span>{data.current_ratio?.toFixed(2) || "N/A"}</span></div>
              </div>
            </div>

            <div className="p-6 border border-white/10 rounded-xl bg-card">
              <h4 className="font-semibold mb-4 border-b border-white/10 pb-2">Financial Highlights</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Profit Margin</span><span>{data.profit_margin ? (data.profit_margin * 100).toFixed(2) + "%" : "N/A"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Operating Margin (ttm)</span><span>{data.operating_margin ? (data.operating_margin * 100).toFixed(2) + "%" : "N/A"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Return on Assets (ttm)</span><span>{data.roa ? (data.roa * 100).toFixed(2) + "%" : "N/A"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Return on Equity (ttm)</span><span>{data.roe ? (data.roe * 100).toFixed(2) + "%" : "N/A"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Earnings Growth</span><span>{data.earnings_growth ? (data.earnings_growth * 100).toFixed(2) + "%" : "N/A"}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
