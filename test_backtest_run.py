import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))
from core.backtest import BacktestEngine
from data_providers.yfinance_provider import YFinanceProvider
import pandas as pd

def test_backtest():
    try:
        # Get data
        df = YFinanceProvider.get_historical_prices('MSFT', period="1y")
        if 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date'])
            df = df.set_index('date')
            
        print("Data loaded:", len(df), "rows")
        
        # Test SMA crossover
        print("\nTesting SMA Crossover...")
        res1 = BacktestEngine.run_sma_crossover(df)
        print("SMA Metrics:", res1['metrics']['strategy'])
        
        # Test Mean Reversion
        print("\nTesting Mean Reversion...")
        res2 = BacktestEngine.run_mean_reversion(df)
        print("MR Metrics:", res2['metrics']['strategy'])
        
        print("\nAll backtests passed successfully!")
    except Exception as e:
        print("Error:", str(e))
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_backtest()
