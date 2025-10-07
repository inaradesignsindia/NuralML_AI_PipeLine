import React, { useState } from 'react';
import CryptoChart from '../components/CryptoChart';
import AISignalCard from '../components/AISignalCard';
import TradingTerminal from '../components/TradingTerminal';
import VirtualPortfolio from '../components/VirtualPortfolio';

const Dashboard = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('BTC/USDT');

  // Mock AI signal data
  const aiSignal = {
    signal: 'BULLISH',
    confidence: 87,
    symbol: 'BTC/USDT',
    entryPrice: 43250,
    targetPrice: 46500,
    stopLoss: 41000,
    rationale: 'Strong momentum with increasing volume. RSI showing bullish divergence. Support levels holding firm at $42,000.'
  };

  const symbols = [
    { symbol: 'BTC/USDT', name: 'Bitcoin', price: 43250.75, change: 2.98 },
    { symbol: 'ETH/USDT', name: 'Ethereum', price: 2650.30, change: 1.45 },
    { symbol: 'ADA/USDT', name: 'Cardano', price: 0.485, change: -0.85 },
    { symbol: 'SOL/USDT', name: 'Solana', price: 98.75, change: 3.21 },
  ];

  return (
    <div className="space-y-6">
      {/* Virtual Portfolio - Shows when simulation mode is active */}
      <VirtualPortfolio />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Trading Dashboard</h1>
          <p className="text-gray-400 mt-1">Real-time crypto trading with AI signals</p>
        </div>
        <div className="mt-4 lg:mt-0 flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm text-gray-400">Portfolio Value</div>
            <div className="text-2xl font-bold text-white">$125,680.50</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">24h P&L</div>
            <div className="text-xl font-bold text-green-400">+$2,450.75</div>
          </div>
        </div>
      </div>

      {/* Symbol Selector */}
      <div className="glass-card p-4 rounded-xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {symbols.map((sym) => (
            <button
              key={sym.symbol}
              onClick={() => setSelectedSymbol(sym.symbol)}
              className={`p-3 rounded-lg transition-colors ${
                selectedSymbol === sym.symbol
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <div className="font-semibold">{sym.name}</div>
              <div className="text-sm">${sym.price.toLocaleString()}</div>
              <div className={`text-xs ${sym.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {sym.change >= 0 ? '+' : ''}{sym.change}%
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="xl:col-span-2">
          <div className="glass-card p-6 rounded-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">{selectedSymbol} Chart</h2>
              <div className="flex gap-2">
                {['1H', '4H', '1D', '1W'].map((tf) => (
                  <button
                    key={tf}
                    className="px-3 py-1 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600 transition-colors"
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
            <CryptoChart symbol={selectedSymbol} height={400} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* AI Signal Card */}
          <AISignalCard signal={aiSignal} />

          {/* Trading Terminal */}
          <TradingTerminal />

          {/* Quick Stats */}
          <div className="glass-card p-4 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-4">Market Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">24h Volume</span>
                <span className="text-white">$2.4B</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Market Cap</span>
                <span className="text-white">$850B</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">BTC Dominance</span>
                <span className="text-white">52.3%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;