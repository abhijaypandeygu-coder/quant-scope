import { useState, useRef, useEffect } from "react";
import { createChart, ColorType } from "lightweight-charts";
import { Search, Play, Settings2, BarChart2, Bookmark } from "lucide-react";
import { usePortfolio } from "../hooks/usePortfolio";

export function Research() {
  const [ticker, setTicker] = useState("MSFT");
  const [strategy, setStrategy] = useState("sma_crossover");
  const [params, setParams] = useState({ short_window: 20, long_window: 50, window: 20, num_std: 2 });
  
  const { portfolio } = usePortfolio();

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);

  const executeBacktest = async (targetTicker: string) => {
    if (!targetTicker.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/research/backtest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker: targetTicker,
          strategy,
          params
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Backtest failed");
      setResults(data.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const runBacktest = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeBacktest(ticker.toUpperCase());
  };

  useEffect(() => {
    if (!results || !chartContainerRef.current) return;

    if (chartRef.current) {
      chartRef.current.remove();
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#a1a1aa", 
      },
      grid: {
        vertLines: { color: "#27272a" },
        horzLines: { color: "#27272a" },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
    });
    
    chartRef.current = chart;

    const bnhSeries = chart.addLineSeries({
      color: '#3b82f6', // Blue for Buy & Hold
      lineWidth: 2,
      title: 'Buy & Hold'
    });

    const strategySeries = chart.addLineSeries({
      color: '#22c55e', // Green for Strategy
      lineWidth: 2,
      title: 'Strategy'
    });

    const formattedBnh = results.equity_curve.map((d: any) => ({
      time: d.time,
      value: d.bnh,
    }));
    
    const formattedStrategy = results.equity_curve.map((d: any) => ({
      time: d.time,
      value: d.strategy,
    }));

    bnhSeries.setData(formattedBnh);
    strategySeries.setData(formattedStrategy);

    chart.timeScale().fitContent();

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current?.clientWidth });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [results]);

  const MetricCard = ({ title, value, isPercent = false }: { title: string, value: number, isPercent?: boolean }) => {
    const formatted = isPercent 
      ? `${(value * 100).toFixed(2)}%`
      : value.toFixed(2);
      
    const color = value > 0 ? "text-green-500" : value < 0 ? "text-red-500" : "text-white";
    
    return (
      <div className="bg-[#111] border border-white/10 rounded-lg p-4">
        <div className="text-sm text-muted-foreground mb-1">{title}</div>
        <div className={`text-xl font-bold ${title.includes("Drawdown") ? (value < -0.2 ? "text-red-500" : "text-white") : color}`}>
          {formatted}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#050505]">
      <div className="p-8 border-b border-white/5">
        <h1 className="text-3xl font-bold mb-2">Research & Backtesting</h1>
        <p className="text-muted-foreground">Test quantitative trading strategies on historical data.</p>
      </div>

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Controls Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#111] border border-white/10 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Settings2 className="w-5 h-5" />
                Strategy Configuration
              </h2>
              
              <form onSubmit={runBacktest} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Asset Ticker</label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={ticker}
                      onChange={(e) => setTicker(e.target.value.toUpperCase())}
                      placeholder="e.g. MSFT"
                      className="w-full bg-black/60 border border-white/10 rounded-md pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:bg-black"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Strategy Type</label>
                  <select
                    value={strategy}
                    onChange={(e) => setStrategy(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="sma_crossover">SMA Crossover</option>
                    <option value="mean_reversion">Mean Reversion (Bollinger)</option>
                  </select>
                </div>

                {strategy === "sma_crossover" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Short Window</label>
                      <input
                        type="number"
                        value={params.short_window}
                        onChange={(e) => setParams({...params, short_window: parseInt(e.target.value)})}
                        className="w-full bg-black/60 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Long Window</label>
                      <input
                        type="number"
                        value={params.long_window}
                        onChange={(e) => setParams({...params, long_window: parseInt(e.target.value)})}
                        className="w-full bg-black/60 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                )}
                
                {strategy === "mean_reversion" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Window</label>
                      <input
                        type="number"
                        value={params.window}
                        onChange={(e) => setParams({...params, window: parseInt(e.target.value)})}
                        className="w-full bg-black/60 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Std Devs</label>
                      <input
                        type="number"
                        step="0.1"
                        value={params.num_std}
                        onChange={(e) => setParams({...params, num_std: parseFloat(e.target.value)})}
                        className="w-full bg-black/60 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 py-2.5 rounded-md font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <div className="h-5 w-5 border-2 border-current border-t-transparent animate-spin rounded-full" />
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Run Backtest
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="bg-[#111] border border-white/10 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Bookmark className="w-5 h-5" />
                Portfolio Holdings
              </h2>
              <div className="flex flex-wrap gap-2">
                {portfolio.length === 0 && (
                  <span className="text-sm text-muted-foreground">No assets in portfolio. Add them in the Portfolio tab.</span>
                )}
                {portfolio.map(p => (
                  <button
                    key={p.ticker}
                    onClick={() => {
                      setTicker(p.ticker);
                      executeBacktest(p.ticker);
                    }}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md border transition-colors ${
                      ticker.toUpperCase() === p.ticker 
                        ? "bg-primary/20 border-primary text-primary" 
                        : "bg-black/40 border-white/10 text-muted-foreground hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {p.ticker}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-3 space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-md">
                {error}
              </div>
            )}
            
            {results ? (
              <>
                <div className="bg-[#111] border border-white/10 rounded-xl p-6">
                  <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <BarChart2 className="w-5 h-5" />
                    Equity Curve (5Y)
                  </h2>
                  <div ref={chartContainerRef} className="w-full" />
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Strategy Performance</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <MetricCard title="Total Return" value={results.metrics.strategy.total_return} isPercent />
                      <MetricCard title="Ann. Volatility" value={results.metrics.strategy.annualized_volatility} isPercent />
                      <MetricCard title="Max Drawdown" value={results.metrics.strategy.max_drawdown} isPercent />
                      <MetricCard title="Sharpe Ratio" value={results.metrics.strategy.sharpe_ratio} />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-muted-foreground">Buy & Hold Benchmark</h3>
                    <div className="grid grid-cols-2 gap-4 opacity-80">
                      <MetricCard title="Total Return" value={results.metrics.bnh.total_return} isPercent />
                      <MetricCard title="Ann. Volatility" value={results.metrics.bnh.annualized_volatility} isPercent />
                      <MetricCard title="Max Drawdown" value={results.metrics.bnh.max_drawdown} isPercent />
                      <MetricCard title="Sharpe Ratio" value={results.metrics.bnh.sharpe_ratio} />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground border border-white/5 border-dashed rounded-xl p-12 bg-[#111]/50">
                <BarChart2 className="w-16 h-16 mb-4 opacity-20" />
                <p>Configure a strategy and run a backtest to see results.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
