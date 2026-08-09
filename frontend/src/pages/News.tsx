import { useState, useEffect } from "react";
import { Search, Newspaper, ExternalLink, Calendar, Loader2 } from "lucide-react";

interface NewsItem {
  title: string;
  publisher: string;
  link: string;
  providerPublishTime: number;
}

export function News() {
  const [ticker, setTicker] = useState("AAPL");
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = async (searchTicker: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:8000/api/market/news/${searchTicker}`);
      if (!res.ok) throw new Error("Failed to fetch news");
      const data = await res.json();
      setNews(data.news || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews(ticker);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticker.trim()) fetchNews(ticker.trim().toUpperCase());
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Market News</h2>
          <p className="text-muted-foreground mt-2">Latest headlines and press releases</p>
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
      ) : news.length === 0 ? (
        <div className="p-12 border border-white/10 rounded-xl bg-card text-center text-muted-foreground">
          <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No news found for {ticker.toUpperCase()}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {news.map((item, index) => (
            <a 
              key={index} 
              href={item.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block p-5 border border-white/10 rounded-xl bg-card hover:bg-white/5 transition-colors group flex flex-col h-full"
            >
              <div className="flex-1">
                <h3 className="font-semibold text-lg line-clamp-3 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <span className="font-medium text-foreground">{item.publisher}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(item.providerPublishTime * 1000).toLocaleDateString()}
                  </span>
                  <ExternalLink className="h-3 w-3 group-hover:text-primary" />
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
