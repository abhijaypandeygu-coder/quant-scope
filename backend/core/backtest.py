import pandas as pd
import numpy as np
from typing import Dict, Any

class BacktestEngine:
    @staticmethod
    def calculate_performance(df: pd.DataFrame, strategy_col: str = 'strategy_returns', initial_capital: float = 10000.0) -> Dict[str, Any]:
        """
        Calculates performance metrics for both Buy & Hold and the Strategy.
        Expects a dataframe with 'daily_return' (B&H) and strategy_col (Strategy).
        """
        # Calculate cumulative returns (equity curves)
        df['bnh_equity'] = initial_capital * (1 + df['daily_return']).cumprod()
        df['strategy_equity'] = initial_capital * (1 + df[strategy_col]).cumprod()
        
        # Calculate B&H metrics
        bnh_total_return = (df['bnh_equity'].iloc[-1] / initial_capital) - 1
        bnh_ann_volatility = df['daily_return'].std() * np.sqrt(252)
        bnh_drawdown = (df['bnh_equity'] / df['bnh_equity'].cummax()) - 1
        bnh_max_dd = bnh_drawdown.min()
        bnh_sharpe = (df['daily_return'].mean() / df['daily_return'].std()) * np.sqrt(252) if df['daily_return'].std() != 0 else 0
        
        # Calculate Strategy metrics
        strat_total_return = (df['strategy_equity'].iloc[-1] / initial_capital) - 1
        strat_ann_volatility = df[strategy_col].std() * np.sqrt(252)
        strat_drawdown = (df['strategy_equity'] / df['strategy_equity'].cummax()) - 1
        strat_max_dd = strat_drawdown.min()
        strat_sharpe = (df[strategy_col].mean() / df[strategy_col].std()) * np.sqrt(252) if df[strategy_col].std() != 0 else 0
        
        # Format equity curve for chart
        # Keep only valid dates (no NaNs)
        valid_df = df.dropna(subset=['bnh_equity', 'strategy_equity'])
        equity_curve = [
            {
                "time": str(idx.date()) if isinstance(idx, pd.Timestamp) else str(idx),
                "bnh": round(row['bnh_equity'], 2),
                "strategy": round(row['strategy_equity'], 2)
            }
            for idx, row in valid_df.iterrows()
        ]
        
        return {
            "metrics": {
                "bnh": {
                    "total_return": bnh_total_return,
                    "annualized_volatility": bnh_ann_volatility,
                    "max_drawdown": bnh_max_dd,
                    "sharpe_ratio": bnh_sharpe
                },
                "strategy": {
                    "total_return": strat_total_return,
                    "annualized_volatility": strat_ann_volatility,
                    "max_drawdown": strat_max_dd,
                    "sharpe_ratio": strat_sharpe
                }
            },
            "equity_curve": equity_curve
        }

    @staticmethod
    def run_sma_crossover(df: pd.DataFrame, short_window: int = 20, long_window: int = 50) -> Dict[str, Any]:
        """
        Runs a Simple Moving Average (SMA) crossover backtest.
        Signal = 1 (Long) if Short SMA > Long SMA, else 0 (Cash).
        """
        # Create a copy to avoid mutating the original
        data = df.copy()
        
        if 'close' not in data.columns:
            raise ValueError("DataFrame must contain a 'close' column")
            
        data['daily_return'] = data['close'].pct_change()
        
        # Calculate SMAs
        data['sma_short'] = data['close'].rolling(window=short_window).mean()
        data['sma_long'] = data['close'].rolling(window=long_window).mean()
        
        # Generate Signals: 1 if short > long, else 0
        # Shift signal by 1 day because signal generated today can only be traded tomorrow
        data['signal'] = np.where(data['sma_short'] > data['sma_long'], 1.0, 0.0)
        data['position'] = data['signal'].shift(1)
        
        # Calculate Strategy Returns
        data['strategy_returns'] = data['position'] * data['daily_return']
        
        # Fill NaNs with 0 to prevent compounding issues at start
        data['strategy_returns'] = data['strategy_returns'].fillna(0)
        data['daily_return'] = data['daily_return'].fillna(0)
        
        # Calculate performance
        return BacktestEngine.calculate_performance(data)

    @staticmethod
    def run_mean_reversion(df: pd.DataFrame, window: int = 20, num_std: float = 2.0) -> Dict[str, Any]:
        """
        Runs a Bollinger Band mean reversion backtest.
        Buy when price hits lower band, sell (go to cash) when price hits upper band.
        """
        data = df.copy()
        
        if 'close' not in data.columns:
            raise ValueError("DataFrame must contain a 'close' column")
            
        data['daily_return'] = data['close'].pct_change()
        
        # Calculate Bollinger Bands
        data['sma'] = data['close'].rolling(window=window).mean()
        data['std'] = data['close'].rolling(window=window).std()
        data['upper_band'] = data['sma'] + (data['std'] * num_std)
        data['lower_band'] = data['sma'] - (data['std'] * num_std)
        
        # Generate Signals
        # 1 = Long, 0 = Flat
        # Initialize with NaN
        data['signal'] = np.nan
        
        # Buy condition: Price crosses below lower band
        data.loc[data['close'] < data['lower_band'], 'signal'] = 1.0
        
        # Sell condition: Price crosses above upper band
        data.loc[data['close'] > data['upper_band'], 'signal'] = 0.0
        
        # Forward fill the signals (hold position until exit condition met)
        data['signal'] = data['signal'].ffill()
        
        # Default to flat if we haven't hit a signal yet
        data['signal'] = data['signal'].fillna(0)
        
        # Shift signal by 1 for realistic execution
        data['position'] = data['signal'].shift(1)
        
        # Calculate Returns
        data['strategy_returns'] = data['position'] * data['daily_return']
        
        # Fill NaNs
        data['strategy_returns'] = data['strategy_returns'].fillna(0)
        data['daily_return'] = data['daily_return'].fillna(0)
        
        return BacktestEngine.calculate_performance(data)
