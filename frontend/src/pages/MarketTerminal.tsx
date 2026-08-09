import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { createChart, ColorType } from "lightweight-charts";
import { Pin, PinOff, Briefcase, Check } from "lucide-react";
import { usePinnedAssets } from "../hooks/usePinnedAssets";
import { usePortfolio } from "../hooks/usePortfolio";

export function MarketTerminal() {
  const { ticker } = useParams<{ ticker: string }>();
  const [data, setData] = useState<any>(null);
  const [fundamentals, setFundamentals] = useState<any>(null);
  const [news, setNews] = useState<any[]>([]);
  const [related, setRelated] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);
  
  const { isPinned, togglePin } = usePinnedAssets();
  const pinned = ticker ? isPinned(ticker) : false;

  const { portfolio, addAsset, removeAsset } = usePortfolio();
  const inPortfolio = ticker ? portfolio.some(a => a.ticker === ticker.toUpperCase()) : false;

  const handlePortfolioToggle = () => {
    if (!ticker) return;
    if (inPortfolio) {
      removeAsset(ticker.toUpperCase());
    } else {
      addAsset(ticker.toUpperCase(), 0.1); // Add with a default 10% weight
    }
  };

  useEffect(() => {
    // Fetch price data
    fetch(`http://127.0.0.1:8000/api/market/prices/${ticker}?period=1y&indicators=true`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.detail || "Failed to fetch data");
        return json;
      })
      .then(res => {
        if (res.data) setData(res.data);
      })
      .catch(e => setError(e.message));

    // Fetch fundamentals
    fetch(`http://127.0.0.1:8000/api/market/fundamentals/${ticker}`)
      .then(res => res.json())
      .then(res => {
        if (res.data) setFundamentals(res.data);
      })
      .catch(console.error);
      
    // Fetch news
    fetch(`http://127.0.0.1:8000/api/market/news/${ticker}`)
      .then(res => res.json())
      .then(res => {
        if (res.news) setNews(res.news);
      })
      .catch(console.error);

    // Fetch related stocks
    fetch(`http://127.0.0.1:8000/api/market/related/${ticker}`)
      .then(res => res.json())
      .then(res => {
        if (res.related) setRelated(res.related);
      })
      .catch(console.error);
  }, [ticker]);

  useEffect(() => {
    if (!data || !chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#a1a1aa", // text-muted-foreground equivalent
      },
      grid: {
        vertLines: { color: "#27272a" }, // border-color equivalent
        horzLines: { color: "#27272a" },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
    });
    
    chartRef.current = chart;

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    const formattedData = data.map((d: any) => ({
      time: d.date,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    candlestickSeries.setData(formattedData);
    seriesRef.current = candlestickSeries;

    // Optional: Add SMA indicator line
    const smaData = data.filter((d:any) => d.sma_20 !== null).map((d: any) => ({
      time: d.date,
      value: d.sma_20,
    }));
    if (smaData.length > 0) {
      const smaLine = chart.addLineSeries({
        color: '#3b82f6',
        lineWidth: 2,
      });
      smaLine.setData(smaData);
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current?.clientWidth });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data]);

  if (error) {
    return (
      <div className="p-12 text-center text-destructive">
        <h2 className="text-2xl font-bold mb-2">Data Error</h2>
        <p>{error}</p>
        <p className="text-muted-foreground mt-4 text-sm">The ticker might be invalid or delisted.</p>
      </div>
    );
  }

  if (!data) return <div className="p-8">Loading {ticker}...</div>;

  const getCurrencySymbol = (currencyCode: string) => {
    const symbols: Record<string, string> = {
      USD: '$', EUR: '€', GBP: '£', INR: '₹', JPY: '¥',
      AUD: 'A$', CAD: 'C$', CHF: 'CHF ', CNY: '¥', HKD: 'HK$', SGD: 'S$'
    };
    return symbols[currencyCode] || currencyCode + ' ';
  };

  const currencySymbol = fundamentals?.currency ? getCurrencySymbol(fundamentals.currency) : '$';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between border-b pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{ticker?.toUpperCase()}</h1>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => ticker && togglePin(ticker)}
                className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-muted-foreground hover:text-white"
                title={pinned ? "Unpin this asset" : "Pin this asset"}
              >
                {pinned ? <PinOff className="w-5 h-5 text-primary" /> : <Pin className="w-5 h-5" />}
              </button>
              <button 
                onClick={handlePortfolioToggle}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${
                  inPortfolio 
                    ? "bg-primary/20 text-primary hover:bg-primary/30" 
                    : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white"
                }`}
                title={inPortfolio ? "Remove from Portfolio" : "Add to Portfolio"}
              >
                {inPortfolio ? <Check className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
                {inPortfolio ? "In Portfolio" : "Add to Portfolio"}
              </button>
            </div>
          </div>
          {fundamentals && <p className="text-muted-foreground">{fundamentals.name} • {fundamentals.sector}</p>}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{currencySymbol}{data[data.length - 1]?.close.toFixed(2)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="border border-white/10 rounded-xl p-4 bg-card shadow-sm">
            <h3 className="font-semibold mb-4">Price Chart (1Y)</h3>
            <div ref={chartContainerRef} className="w-full" />
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="border border-white/10 rounded-xl p-4 bg-card shadow-sm">
            <h3 className="font-semibold border-b border-white/10 pb-2 mb-4">Fundamentals</h3>
            {fundamentals ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Market Cap</span>
                  <span>{fundamentals.market_cap ? `${currencySymbol}${(fundamentals.market_cap / 1e9).toFixed(2)}B` : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">P/E Ratio</span>
                  <span>{fundamentals.pe_ratio?.toFixed(2) || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Forward P/E</span>
                  <span>{fundamentals.forward_pe?.toFixed(2) || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">P/B Ratio</span>
                  <span>{fundamentals.pb_ratio?.toFixed(2) || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Profit Margin</span>
                  <span>{fundamentals.profit_margin ? `${(fundamentals.profit_margin * 100).toFixed(2)}%` : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ROE</span>
                  <span>{fundamentals.roe ? `${(fundamentals.roe * 100).toFixed(2)}%` : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Debt/Eq</span>
                  <span>{fundamentals.debt_to_equity?.toFixed(2) || 'N/A'}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Loading fundamentals...</p>
            )}
          </div>
        </div>
      </div>

      {/* Related Stocks and News Section */}
      <div className="space-y-8 mt-4">
        {related.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Related stocks</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {related.map(r => {
                const minPrice = Math.min(...r.history);
                const maxPrice = Math.max(...r.history);
                const range = maxPrice - minPrice || 1;
                const points = r.history.map((h: number, i: number) => {
                  const x = i * (100 / (Math.max(1, r.history.length - 1)));
                  const y = 40 - ((h - minPrice) / range) * 30;
                  return `${x},${y}`;
                }).join(' ');

                return (
                  <div key={r.ticker} className="bg-white/5 hover:bg-white/10 transition-colors border border-white/10 rounded-xl p-4 flex flex-col justify-between cursor-pointer" onClick={() => window.location.href = `/market/${r.ticker}`}>
                    <div>
                      <p className="text-sm text-muted-foreground">{r.ticker}</p>
                      <p className="font-semibold text-lg">{r.ticker}</p>
                      <p className="text-sm font-mono mt-1">{currencySymbol}{r.price.toFixed(2)}</p>
                      <p className={`text-sm font-semibold flex items-center gap-1 mt-1 ${r.change >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {r.change >= 0 ? "+" : ""}{r.change.toFixed(2)}%
                      </p>
                    </div>
                    <div className="h-10 mt-4 flex items-end">
                      <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                        <polyline 
                          points={points} 
                          fill="none" 
                          stroke={r.change >= 0 ? "#22c55e" : "#ef4444"} 
                          strokeWidth="2" 
                          vectorEffect="non-scaling-stroke"
                        />
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {news.length > 0 && (
          <div className="space-y-4 border-t border-white/10 pt-6">
            <div>
              <h3 className="text-xl font-bold">News stories</h3>
              <p className="text-sm text-muted-foreground">From sources across the web</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {news.slice(0, 6).map((n, i) => (
                <a key={i} href={n.link} target="_blank" rel="noopener noreferrer" className="block group">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-[10px] font-bold text-primary">
                      {n.publisher.charAt(0)}
                    </div>
                    <span className="text-sm font-medium">{n.publisher}</span>
                    <span className="text-sm text-muted-foreground">• {new Date(n.publish_time * 1000).toLocaleDateString()}</span>
                  </div>
                  <h4 className="text-lg font-semibold group-hover:text-primary transition-colors line-clamp-2">{n.title}</h4>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
