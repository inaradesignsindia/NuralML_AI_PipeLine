import React, { useState } from 'react';
import CryptoChart from '../components/CryptoChart';
import AISignalCard from '../components/AISignalCard';

const AIQuantAnalysis = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('BTC/USDT');
  const [timeframe, setTimeframe] = useState('1H');

  const symbols = ['BTC/USDT', 'ETH/USDT', 'ADA/USDT', 'SOL/USDT'];
  const timeframes = ['5m', '15m', '1H', '4H', '1D'];

  const aiSignals = {
    'BTC/USDT': {
      signal: 'BULLISH',
      confidence: 87,
      symbol: 'BTC/USDT',
      entryPrice: 43250,
      targetPrice: 46500,
      stopLoss: 41000,
      rationale: 'Strong momentum with increasing volume. RSI showing bullish divergence. Support levels holding firm at $42,000. AI models predict 15% upside potential.'
    },
    'ETH/USDT': {
      signal: 'BEARISH',
      confidence: 74,
      symbol: 'ETH/USDT',
      entryPrice: 2650,
      targetPrice: 2350,
      stopLoss: 2750,
      rationale: 'Bearish divergence on MACD. Resistance at $2,700 holding. Institutional selling pressure detected. Risk-reward ratio favors short positions.'
    },
    'ADA/USDT': {
      signal: 'NEUTRAL',
      confidence: 52,
      symbol: 'ADA/USDT',
      entryPrice: 0.485,
      targetPrice: 0.520,
      stopLoss: 0.450,
      rationale: 'Consolidation phase. Low volatility suggests range-bound movement. Waiting for clearer directional signals from AI models.'
    },
    'SOL/USDT': {
      signal: 'BULLISH',
      confidence: 91,
      symbol: 'SOL/USDT',
      entryPrice: 98.75,
      targetPrice: 125.00,
      stopLoss: 92.00,
      rationale: 'Exceptional momentum with strong fundamentals. Network adoption increasing. AI confidence extremely high for upside movement.'
    }
  };

  const quantMetrics = {
    'BTC/USDT': {
      rsi: 68,
      macd: 'Bullish',
      volume: 'High',
      support: 42000,
      resistance: 45000,
      volatility: 'Medium'
    },
    'ETH/USDT': {
      rsi: 45,
      macd: 'Bearish',
      volume: 'Medium',
      support: 2500,
      resistance: 2800,
      volatility: 'High'
    },
    'ADA/USDT': {
      rsi: 52,
      macd: 'Neutral',
      volume: 'Low',
      support: 0.45,
      resistance: 0.52,
      volatility: 'Low'
    },
    'SOL/USDT': {
      rsi: 72,
      macd: 'Bullish',
      volume: 'High',
      support: 95,
      resistance: 110,
      volatility: 'High'
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">🧠 AI Quant Analysis</h1>
          <p className="text-gray-400 mt-1">Advanced AI-powered trading signals and quantitative analysis</p>
        </div>
        <div className="mt-4 lg:mt-0 flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm text-gray-400">AI Model Accuracy</div>
            <div className="text-2xl font-bold text-green-400">87.3%</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Signals Today</div>
            <div className="text-2xl font-bold text-blue-400">24</div>
          </div>
        </div>
      </div>

      {/* Symbol and Timeframe Selector */}
      <div className="glass-card p-4 rounded-xl">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-400 mb-2">Symbol</label>
            <div className="flex gap-2">
              {symbols.map((symbol) => (
                <button
                  key={symbol}
                  onClick={() => setSelectedSymbol(symbol)}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    selectedSymbol === symbol
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {symbol}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Timeframe</label>
            <div className="flex gap-2">
              {timeframes.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    timeframe === tf
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="xl:col-span-2 space-y-6">
          <div className="glass-card p-6 rounded-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">
                {selectedSymbol} - AI Enhanced Chart
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">AI Overlay:</span>
                <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">Active</span>
              </div>
            </div>
            <CryptoChart symbol={selectedSymbol} height={500} />
          </div>

          {/* Quantitative Metrics */}
          <div className="glass-card p-6 rounded-xl">
            <h3 className="text-xl font-semibold text-white mb-4">Quantitative Analysis</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-800 rounded-lg">
                <div className="text-sm text-gray-400">RSI</div>
                <div className="text-2xl font-bold text-white">{quantMetrics[selectedSymbol].rsi}</div>
                <div className={`text-xs ${quantMetrics[selectedSymbol].rsi > 70 ? 'text-red-400' : quantMetrics[selectedSymbol].rsi < 30 ? 'text-green-400' : 'text-yellow-400'}`}>
                  {quantMetrics[selectedSymbol].rsi > 70 ? 'Overbought' : quantMetrics[selectedSymbol].rsi < 30 ? 'Oversold' : 'Neutral'}
                </div>
              </div>
              <div className="text-center p-4 bg-gray-800 rounded-lg">
                <div className="text-sm text-gray-400">MACD</div>
                <div className={`text-lg font-bold ${quantMetrics[selectedSymbol].macd === 'Bullish' ? 'text-green-400' : quantMetrics[selectedSymbol].macd === 'Bearish' ? 'text-red-400' : 'text-yellow-400'}`}>
                  {quantMetrics[selectedSymbol].macd}
                </div>
              </div>
              <div className="text-center p-4 bg-gray-800 rounded-lg">
                <div className="text-sm text-gray-400">Volume</div>
                <div className={`text-lg font-bold ${quantMetrics[selectedSymbol].volume === 'High' ? 'text-green-400' : quantMetrics[selectedSymbol].volume === 'Low' ? 'text-red-400' : 'text-yellow-400'}`}>
                  {quantMetrics[selectedSymbol].volume}
                </div>
              </div>
              <div className="text-center p-4 bg-gray-800 rounded-lg">
                <div className="text-sm text-gray-400">Support</div>
                <div className="text-lg font-bold text-green-400">${quantMetrics[selectedSymbol].support.toLocaleString()}</div>
              </div>
              <div className="text-center p-4 bg-gray-800 rounded-lg">
                <div className="text-sm text-gray-400">Resistance</div>
                <div className="text-lg font-bold text-red-400">${quantMetrics[selectedSymbol].resistance.toLocaleString()}</div>
              </div>
              <div className="text-center p-4 bg-gray-800 rounded-lg">
                <div className="text-sm text-gray-400">Volatility</div>
                <div className={`text-lg font-bold ${quantMetrics[selectedSymbol].volatility === 'High' ? 'text-red-400' : quantMetrics[selectedSymbol].volatility === 'Low' ? 'text-green-400' : 'text-yellow-400'}`}>
                  {quantMetrics[selectedSymbol].volatility}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* AI Signal Card */}
          <AISignalCard signal={aiSignals[selectedSymbol]} />

          {/* AI Features */}
          <div className="glass-card p-4 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-4">🤖 AI Features</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Pattern Recognition</span>
                <span className="text-green-400 text-sm">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Sentiment Analysis</span>
                <span className="text-green-400 text-sm">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Risk Assessment</span>
                <span className="text-green-400 text-sm">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Market Prediction</span>
                <span className="text-yellow-400 text-sm">Training</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass-card p-4 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-4">⚡ Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors">
                Execute AI Strategy
              </button>
              <button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors">
                Backtest Signals
              </button>
              <button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 rounded-lg transition-colors">
                Set Alert
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIQuantAnalysis;