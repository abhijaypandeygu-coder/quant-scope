import { useState, useEffect } from "react";

export function usePinnedAssets() {
  const getPinned = (): string[] => {
    try {
      const stored = localStorage.getItem("quantscope-pinned-assets");
      return stored ? JSON.parse(stored) : ["AAPL"]; // Default pin AAPL
    } catch {
      return ["AAPL"];
    }
  };

  const [pinnedAssets, setPinnedAssetsState] = useState<string[]>(getPinned());

  useEffect(() => {
    const handleStorageChange = () => {
      setPinnedAssetsState(getPinned());
    };
    window.addEventListener("quantscope-pinned-change", handleStorageChange);
    return () => window.removeEventListener("quantscope-pinned-change", handleStorageChange);
  }, []);

  const togglePin = (ticker: string) => {
    const current = getPinned();
    const upperTicker = ticker.toUpperCase();
    let updated: string[];
    
    if (current.includes(upperTicker)) {
      updated = current.filter((t) => t !== upperTicker);
    } else {
      updated = [...current, upperTicker];
    }
    
    localStorage.setItem("quantscope-pinned-assets", JSON.stringify(updated));
    setPinnedAssetsState(updated);
    window.dispatchEvent(new Event("quantscope-pinned-change"));
  };

  const isPinned = (ticker: string) => {
    return pinnedAssets.includes(ticker.toUpperCase());
  };

  return { pinnedAssets, togglePin, isPinned };
}
