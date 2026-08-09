import numpy as np
from typing import Dict, List, Any

def generate_synthetic_order_book(mid_price: float, levels: int = 10, spread_bps: float = 2.0) -> Dict[str, Any]:
    """
    Generates a synthetic Level-2 order book around a given mid-price.
    Since we don't have real L2 data, we simulate it with a realistic distribution.
    """
    # Base spread (half spread)
    half_spread = mid_price * (spread_bps / 10000.0) / 2
    
    best_bid = mid_price - half_spread
    best_ask = mid_price + half_spread
    
    bids = []
    asks = []
    
    # Randomize total volume slightly
    base_volume = int(max(100, 1000000 / mid_price))
    
    # Generate levels
    for i in range(levels):
        # Prices move away from mid price
        bid_price = best_bid - (i * mid_price * 0.0001 * np.random.uniform(0.5, 1.5))
        ask_price = best_ask + (i * mid_price * 0.0001 * np.random.uniform(0.5, 1.5))
        
        # Volume generally increases as we move away from top of book, then decays
        # We'll use a simple gamma-like shape or just random with increasing mean
        vol_multiplier = np.random.uniform(0.5, 2.0) * (1 + i * 0.2)
        bid_vol = int(base_volume * vol_multiplier)
        ask_vol = int(base_volume * np.random.uniform(0.5, 2.0) * (1 + i * 0.2))
        
        bids.append({"price": round(bid_price, 2), "size": bid_vol})
        asks.append({"price": round(ask_price, 2), "size": ask_vol})
        
    return {
        "bids": bids,
        "asks": asks,
        "mid_price": round(mid_price, 2),
        "spread": round(best_ask - best_bid, 4)
    }

def calculate_imbalance(bids: List[Dict], asks: List[Dict], levels: int = 5) -> float:
    """
    Calculates order book imbalance using the top N levels.
    Imbalance = (Bid Volume - Ask Volume) / (Bid Volume + Ask Volume)
    Range: -1 to +1
    """
    bid_vol = sum([b["size"] for b in bids[:levels]])
    ask_vol = sum([a["size"] for a in asks[:levels]])
    
    total_vol = bid_vol + ask_vol
    if total_vol == 0:
        return 0.0
        
    return (bid_vol - ask_vol) / total_vol

def calculate_microprice(bids: List[Dict], asks: List[Dict]) -> float:
    """
    Calculates the Microprice based on the best bid and best ask.
    Microprice = (Best Bid * Ask Volume + Best Ask * Bid Volume) / (Bid Volume + Ask Volume)
    """
    if not bids or not asks:
        return 0.0
        
    best_bid = bids[0]["price"]
    bid_vol = bids[0]["size"]
    
    best_ask = asks[0]["price"]
    ask_vol = asks[0]["size"]
    
    total_vol = bid_vol + ask_vol
    if total_vol == 0:
        return (best_bid + best_ask) / 2
        
    return (best_bid * ask_vol + best_ask * bid_vol) / total_vol

def generate_tape(mid_price: float, count: int = 20) -> List[Dict[str, Any]]:
    """
    Generate synthetic Time and Sales (tape) data.
    """
    import time
    tape = []
    current_time = time.time()
    
    for i in range(count):
        # Slightly vary the price around the mid price
        price_diff = mid_price * 0.0001 * np.random.uniform(0.5, 3.0)
        side = "buy" if np.random.random() > 0.5 else "sell"
        price = mid_price + price_diff if side == "buy" else mid_price - price_diff
        
        # Synthetic sizes (e.g., 100 to 5000 shares)
        size = int(max(10, 100000 / mid_price * np.random.uniform(0.1, 2.0)))
        
        # Time intervals (milliseconds ago)
        timestamp = current_time - (i * np.random.uniform(0.1, 2.5))
        
        tape.append({
            "price": round(price, 2),
            "size": size,
            "side": side,
            "timestamp": timestamp
        })
        
    return tape

def estimate_vpin(bids: List[Dict], asks: List[Dict]) -> float:
    """
    Proxy for VPIN (Volume-Synchronized Probability of Informed Trading).
    We estimate toxicity based on bid/ask volume imbalance at the top of the book + randomness.
    Returns a value between 0.0 (low toxicity) and 1.0 (high toxicity).
    """
    if not bids or not asks:
        return 0.0
        
    bid_vol = sum([b["size"] for b in bids[:3]])
    ask_vol = sum([a["size"] for a in asks[:3]])
    total_vol = bid_vol + ask_vol
    
    if total_vol == 0:
        return 0.5
        
    # Imbalance absolute value as a base proxy for VPIN
    base_toxicity = abs(bid_vol - ask_vol) / total_vol
    
    # Add some stochastic noise typical in short timeframes
    noise = np.random.uniform(-0.1, 0.2)
    
    return float(np.clip(base_toxicity + noise, 0.1, 0.95))

def get_flow_metrics() -> Dict[str, float]:
    """
    Generates synthetic HFT flow metrics like Cancel-to-Fill and Spread Volatility.
    """
    return {
        "cancel_to_fill": round(np.random.uniform(5.0, 25.0), 1),
        "spread_volatility": round(np.random.uniform(0.5, 3.5), 2) # in bps
    }

def estimate_slippage(order_size_usd: float, side: str, order_book: Dict[str, Any]) -> float:
    """
    Simulates walking the synthetic order book to estimate price impact/slippage.
    Returns slippage in basis points (bps).
    """
    levels = order_book["asks"] if side == "buy" else order_book["bids"]
    mid_price = order_book["mid_price"]
    
    remaining_usd = order_size_usd
    total_cost = 0.0
    filled_shares = 0
    
    for level in levels:
        price = level["price"]
        available_shares = level["size"]
        available_usd = price * available_shares
        
        if remaining_usd <= available_usd:
            # We can fill the rest here
            shares_to_take = remaining_usd / price
            filled_shares += shares_to_take
            total_cost += remaining_usd
            remaining_usd = 0
            break
        else:
            # Take all shares at this level
            filled_shares += available_shares
            total_cost += available_usd
            remaining_usd -= available_usd
            
    if filled_shares == 0:
        return 0.0
        
    avg_execution_price = total_cost / filled_shares
    
    # Calculate slippage in bps relative to mid_price
    if side == "buy":
        slippage_bps = ((avg_execution_price - mid_price) / mid_price) * 10000
    else:
        slippage_bps = ((mid_price - avg_execution_price) / mid_price) * 10000
        
    return round(float(slippage_bps), 2)
