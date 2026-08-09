import { useState, useEffect } from "react";
import { Search, Database, Loader2, Download, Table as TableIcon } from "lucide-react";

export function Data() {
  const [ticker, setTicker] = useState("AAPL");
  const [period, setPeriod] = useState("1y");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (searchTicker: string, searchPeriod: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:8000/api/market/prices/${searchTicker}?period=${searchPeriod}&indicators=true`);
      if (!res.ok) throw new Error("Failed to fetch historical data");
      const json = await res.json();
      // Reverse the array to show most recent first
      setData([...json.data].reverse());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(ticker, period);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticker.trim()) fetchData(ticker.trim().toUpperCase(), period);
  };

  const handleDownload = () => {
    if (!data.length) return;
    
    // Get headers
    const headers = Object.keys(data[0]);
    // Map rows
    const rows = data.map(row => 
      headers.map(header => {
        const val = row[header];
        // Handle dates or strings with commas
        return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
      }).join(',')
    );
    
    // Combine
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    
    // Trigger download
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${ticker}_${period}_data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex justify-between items-end shrink-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Data Center</h2>
          <p className="text-muted-foreground mt-2">Download raw quantitative datasets</p>
        </div>
        
        <div className="flex gap-4 items-end">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Enter ticker..." 
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                className="pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-lg focus:outline-none focus:border-primary/50 text-sm w-32"
              />
            </div>
            
            <select 
              value={period} 
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
            >
              <option value="1mo">1 Month</option>
              <option value="3mo">3 Months</option>
              <option value="6mo">6 Months</option>
              <option value="1y">1 Year</option>
              <option value="2y">2 Years</option>
              <option value="5y">5 Years</option>
            </select>

            <button 
              type="submit" 
              disabled={loading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 text-sm font-medium"
            >
              Fetch
            </button>
          </form>

          <button 
            onClick={handleDownload}
            disabled={loading || data.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/10 rounded-lg hover:bg-white/20 disabled:opacity-50 text-sm font-medium transition-colors"
          >
            <Download className="h-4 w-4" />
            CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center border border-white/10 rounded-xl bg-card">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="p-6 border border-red-500/30 bg-red-500/10 rounded-xl text-red-400 shrink-0">
          Error: {error}
        </div>
      ) : data.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center border border-white/10 rounded-xl bg-card text-muted-foreground">
          <Database className="h-12 w-12 mb-4 opacity-50" />
          <p>No data available for {ticker.toUpperCase()}.</p>
        </div>
      ) : (
        <div className="flex-1 border border-white/10 rounded-xl bg-card overflow-hidden flex flex-col">
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 shrink-0">
            <div className="flex items-center gap-2 font-medium">
              <TableIcon className="h-4 w-4 text-primary" />
              {ticker.toUpperCase()} - {period} Historical Data
            </div>
            <div className="text-xs text-muted-foreground">
              {data.length} rows loaded
            </div>
          </div>
          
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-black/40 sticky top-0 z-10">
                <tr>
                  {Object.keys(data[0]).map((key) => (
                    <th key={key} className="px-4 py-3 font-medium border-b border-white/10 whitespace-nowrap">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    {Object.values(row).map((val: any, colIdx) => (
                      <td key={colIdx} className="px-4 py-2 whitespace-nowrap text-foreground/80 font-mono text-xs">
                        {typeof val === 'number' ? val.toFixed(4) : val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
