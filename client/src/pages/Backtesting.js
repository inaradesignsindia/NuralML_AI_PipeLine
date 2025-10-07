import React, { useState, useEffect } from 'react';

const Backtesting = () => {
  const [backtestConfig, setBacktestConfig] = useState({
    assets: ['bitcoin', 'ethereum'],
    days: 30,
    speed: 1,
    initialBalance: 10000
  });
  const [backtestStatus, setBacktestStatus] = useState({
    isRunning: false,
    progress: 0,
    results: null
  });
  const [availableAssets, setAvailableAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  // Fetch available assets on component mount
  useEffect(() => {
    fetchAvailableAssets();
  }, []);

  const fetchAvailableAssets = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/simulation/backtest/assets`);
      if (response.ok) {
        const data = await response.json();
        setAvailableAssets(data.availableAssets);
      }
    } catch (error) {
      console.error('Error fetching available assets:', error);
    }
  };

  const startBacktest = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/simulation/backtest/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backtestConfig),
      });

      if (!response.ok) {
        throw new Error('Failed to start backtest');
      }

      const result = await response.json();
      console.log('Backtest started:', result);

      // Start polling for status
      pollBacktestStatus();

    } catch (error) {
      console.error('Error starting backtest:', error);
      alert('Failed to start backtest: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const pollBacktestStatus = () => {
    const poll = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/simulation/backtest/status`);
        if (response.ok) {
          const status = await response.json();
          setBacktestStatus(status);

          if (status.isRunning) {
            // Continue polling if still running
            setTimeout(poll, 2000);
          }
        }
      } catch (error) {
        console.error('Error polling backtest status:', error);
      }
    };

    poll();
  };

  const stopBacktest = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/simulation/backtest/stop`, {
        method: 'POST',
      });

      if (response.ok) {
        setBacktestStatus(prev => ({ ...prev, isRunning: false }));
      }
    } catch (error) {
      console.error('Error stopping backtest:', error);
    }
  };

  const handleAssetToggle = (assetId) => {
    setBacktestConfig(prev => ({
      ...prev,
      assets: prev.assets.includes(assetId)
        ? prev.assets.filter(id => id !== assetId)
        : [...prev.assets, assetId]
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercent = (value) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Backtesting Engine</h1>
        <p className="text-gray-400 mt-1">Test AI trading strategies on historical data</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1">
          <div className="glass-card p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-white mb-6">Backtest Configuration</h2>

            {/* Assets Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-3">
                Assets to Test
              </label>
              <div className="space-y-2">
                {availableAssets.map((asset) => (
                  <label key={asset.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={backtestConfig.assets.includes(asset.id)}
                      onChange={() => handleAssetToggle(asset.id)}
                      className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-white">
                      {asset.name} ({asset.symbol})
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Days Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Historical Days
              </label>
              <input
                type="number"
                value={backtestConfig.days}
                onChange={(e) => setBacktestConfig(prev => ({
                  ...prev,
                  days: Math.max(1, Math.min(365, parseInt(e.target.value) || 30))
                }))}
                min="1"
                max="365"
                className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Speed Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Replay Speed (1x = real-time)
              </label>
              <input
                type="number"
                value={backtestConfig.speed}
                onChange={(e) => setBacktestConfig(prev => ({
                  ...prev,
                  speed: Math.max(0.1, Math.min(10, parseFloat(e.target.value) || 1))
                }))}
                min="0.1"
                max="10"
                step="0.1"
                className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Initial Balance */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Initial Balance ($)
              </label>
              <input
                type="number"
                value={backtestConfig.initialBalance}
                onChange={(e) => setBacktestConfig(prev => ({
                  ...prev,
                  initialBalance: Math.max(100, parseInt(e.target.value) || 10000)
                }))}
                min="100"
                className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Control Buttons */}
            <div className="space-y-3">
              {!backtestStatus.isRunning ? (
                <button
                  onClick={startBacktest}
                  disabled={isLoading || backtestConfig.assets.length === 0}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded transition-colors"
                >
                  {isLoading ? 'Starting...' : 'Start Backtest'}
                </button>
              ) : (
                <button
                  onClick={stopBacktest}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded transition-colors"
                >
                  Stop Backtest
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2">
          {/* Progress and Status */}
          {backtestStatus.isRunning && (
            <div className="glass-card p-6 rounded-xl mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Backtest Progress</h3>
                <span className="text-sm text-blue-400">{backtestStatus.progress.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${backtestStatus.progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-400 mt-2">
                Processing historical data and running AI trading strategies...
              </p>
            </div>
          )}

          {/* Results Display */}
          {backtestStatus.results && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-card p-4 rounded-xl">
                  <div className="text-sm text-gray-400">Final Balance</div>
                  <div className="text-2xl font-bold text-white">
                    {formatCurrency(backtestStatus.results.summary.finalBalance)}
                  </div>
                </div>

                <div className="glass-card p-4 rounded-xl">
                  <div className="text-sm text-gray-400">Total Return</div>
                  <div className={`text-2xl font-bold ${
                    backtestStatus.results.summary.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {formatPercent(backtestStatus.results.summary.totalReturn)}
                  </div>
                </div>

                <div className="glass-card p-4 rounded-xl">
                  <div className="text-sm text-gray-400">Win Rate</div>
                  <div className="text-2xl font-bold text-blue-400">
                    {formatPercent(backtestStatus.results.summary.winRate)}
                  </div>
                </div>

                <div className="glass-card p-4 rounded-xl">
                  <div className="text-sm text-gray-400">Total Trades</div>
                  <div className="text-2xl font-bold text-purple-400">
                    {backtestStatus.results.summary.totalTrades}
                  </div>
                </div>
              </div>

              {/* Detailed Metrics */}
              <div className="glass-card p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-4">Performance Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-md font-medium text-gray-300 mb-3">Risk Metrics</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Max Drawdown:</span>
                        <span className="text-red-400">
                          {formatPercent(backtestStatus.results.riskMetrics.maxDrawdown)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Sharpe Ratio:</span>
                        <span className="text-white">
                          {backtestStatus.results.riskMetrics.sharpeRatio.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-md font-medium text-gray-300 mb-3">Trade Analysis</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Avg Win:</span>
                        <span className="text-green-400">
                          {formatCurrency(backtestStatus.results.tradeAnalysis.avgWin)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Avg Loss:</span>
                        <span className="text-red-400">
                          {formatCurrency(Math.abs(backtestStatus.results.tradeAnalysis.avgLoss))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Profit Factor:</span>
                        <span className="text-white">
                          {backtestStatus.results.tradeAnalysis.profitFactor.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!backtestStatus.isRunning && !backtestStatus.results && (
            <div className="glass-card p-12 rounded-xl text-center">
              <div className="text-6xl mb-4">📈</div>
              <h3 className="text-xl font-semibold text-white mb-2">Ready to Backtest</h3>
              <p className="text-gray-400">
                Configure your backtest parameters and click "Start Backtest" to begin testing AI trading strategies on historical data.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Backtesting;