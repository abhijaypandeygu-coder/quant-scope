import pandas as pd
import numpy as np

def add_technical_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """
    Takes a DataFrame with columns ['date', 'open', 'high', 'low', 'close', 'volume']
    and adds SMA, EMA, VWAP, and Bollinger Bands.
    """
    if df.empty or 'close' not in df.columns:
        return df
        
    # Moving Averages
    df['sma_20'] = df['close'].rolling(window=20, min_periods=1).mean()
    df['sma_50'] = df['close'].rolling(window=50, min_periods=1).mean()
    df['ema_20'] = df['close'].ewm(span=20, adjust=False, min_periods=1).mean()
    
    # VWAP
    # VWAP requires cumulative volume and typical price
    # Standard VWAP usually resets daily, but for a continuous chart, we'll do a rolling VWAP or just cumulative
    typical_price = (df['high'] + df['low'] + df['close']) / 3
    df['vwap'] = (typical_price * df['volume']).cumsum() / df['volume'].cumsum()
    
    # Bollinger Bands (20-period, 2 std dev)
    rolling_mean = df['close'].rolling(window=20, min_periods=1).mean()
    rolling_std = df['close'].rolling(window=20, min_periods=1).std().fillna(0)
    df['bb_upper'] = rolling_mean + (rolling_std * 2)
    df['bb_lower'] = rolling_mean - (rolling_std * 2)
    
    # Replace NaN with None for JSON serialization
    df = df.replace({np.nan: None})
    return df
