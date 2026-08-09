import { Search, Bell, User } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export function Header() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (query.length < 1) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    
    const timeout = setTimeout(() => {
      fetch(`http://127.0.0.1:8000/api/market/search?q=${query}`)
        .then(res => res.json())
        .then(data => {
          setResults(data);
          setShowDropdown(true);
        })
        .catch(console.error);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelect = (ticker: string) => {
    setQuery("");
    setShowDropdown(false);
    navigate(`/market/${ticker}`);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (results.length > 0) {
        handleSelect(results[0].ticker);
      } else if (query.trim()) {
        handleSelect(query.trim().toUpperCase());
      }
    }
  };

  return (
    <header className="h-16 border-b flex items-center justify-between px-6 bg-background relative z-50">
      <div className="flex items-center flex-1 relative">
        <div className="relative w-96 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search AAPL, MSFT... (Ctrl+K)"
            className="w-full bg-black/60 border border-white/10 rounded-md pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:bg-black transition-colors"
          />
          {showDropdown && results.length > 0 && (
            <div className="absolute top-full left-0 w-full mt-1 bg-[#0a0a0a] border border-white/10 rounded-md shadow-2xl overflow-hidden z-[100]">
              {results.map((res) => (
                <div 
                  key={res.ticker}
                  className="px-4 py-2 hover:bg-white/10 cursor-pointer flex justify-between border-b border-white/5 last:border-0"
                  onClick={() => handleSelect(res.ticker)}
                >
                  <span className="font-semibold text-sm text-white">{res.ticker}</span>
                  <span className="text-xs text-gray-400">{res.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          Market Open
        </div>
        <button className="p-2 hover:bg-accent rounded-full transition-colors relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500"></span>
        </button>
        <button className="p-2 hover:bg-accent rounded-full transition-colors">
          <User className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
}
