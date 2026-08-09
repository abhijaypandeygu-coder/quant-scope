import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PinOff } from "lucide-react";
import { usePinnedAssets } from "../../hooks/usePinnedAssets";

export function AssetCard({ ticker }: { ticker: string }) {
  const [data, setData] = useState<any>(null);
  const [fundamentals, setFundamentals] = useState<any>(null);
  const { togglePin } = usePinnedAssets();

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/api/market/prices/${ticker}?period=5d`)
      .then(res => res.json())
      .then(res => {
        if (res.data) setData(res.data);
      })
      .catch(console.error);

    fetch(`http://127.0.0.1:8000/api/market/fundamentals/${ticker}`)
      .then(res => res.json())
      .then(res => {
        if (res.data) setFundamentals(res.data);
      })
      .catch(console.error);
  }, [ticker]);

  const getCurrencySymbol = (currencyCode: string) => {
    const symbols: Record<string, string> = {
      USD: '$', EUR: '€', GBP: '£', INR: '₹', JPY: '¥',
      AUD: 'A$', CAD: 'C$', CHF: 'CHF ', CNY: '¥', HKD: 'HK$', SGD: 'S$'
    };
    return symbols[currencyCode] || currencyCode + ' ';
  };

  const currencySymbol = fundamentals?.currency ? getCurrencySymbol(fundamentals.currency) : '$';
  const latestPrice = data && data.length > 0 ? data[data.length - 1].close : null;

  return (
    <div className="border border-white/10 rounded-xl p-6 bg-card text-card-foreground shadow-sm hover:border-primary/50 transition-colors relative group">
      <button 
        onClick={(e) => { e.preventDefault(); togglePin(ticker); }}
        className="absolute top-4 right-4 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-accent rounded-md hover:bg-destructive hover:text-white"
        title="Unpin"
      >
        <PinOff className="w-4 h-4" />
      </button>
      
      <Link to={`/market/${ticker}`} className="block h-full">
        <h3 className="font-semibold text-lg pr-8 truncate" title={fundamentals?.name || ticker}>
          {fundamentals?.name || ticker}
        </h3>
        <div className="mt-1 flex items-baseline gap-2 text-muted-foreground text-sm">
          <span>{ticker.toUpperCase()}</span>
          {fundamentals?.sector && <span>• {fundamentals.sector}</span>}
        </div>
        
        <div className="mt-4 pt-4 border-t border-white/5 flex items-end justify-between">
          <div className="text-2xl font-bold">
            {latestPrice ? `${currencySymbol}${latestPrice.toFixed(2)}` : '...'}
          </div>
        </div>
      </Link>
    </div>
  );
}
