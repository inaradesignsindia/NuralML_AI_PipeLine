import React, { useState } from 'react';
import CryptoChart from '../components/CryptoChart';
import AISignalCard from '../components/AISignalCard';
import TradingTerminal from '../components/TradingTerminal';
import VirtualPortfolio from '../components/VirtualPortfolio';
import OrderBook from '../components/OrderBook';
import MarketDepth from '../components/MarketDepth';

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
    <div className="space-y-4">
      {/* Virtual Portfolio - Shows when simulation mode is active */}
      <VirtualPortfolio />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-tv-text">Trading Dashboard</h1>
          <p className="text-tv-text-secondary mt-1">Real-time crypto trading with AI signals</p>
        </div>
        <div className="mt-4 lg:mt-0 flex items-center space-x-6">
          <div className="text-right">
            <div className="text-xs text-tv-text-secondary uppercase tracking-wide">Portfolio Value</div>
            <div className="text-xl font-bold text-tv-text">$125,680.50</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-tv-text-secondary uppercase tracking-wide">24h P&L</div>
            <div className="text-lg font-bold text-tv-success">+$2,450.75</div>
          </div>
        </div>
      </div>

      {/* Symbol Selector */}
      <div className="tv-card p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {symbols.map((sym) => (
            <button
              key={sym.symbol}
              onClick={() => setSelectedSymbol(sym.symbol)}
              className={`tv-button p-3 text-left transition-all duration-200 ${
                selectedSymbol === sym.symbol
                  ? 'tv-button-active shadow-md'
                  : 'tv-card-hover'
              }`}
            >
              <div className="font-semibold text-sm">{sym.name}</div>
              <div className="text-xs text-tv-text-secondary">${sym.price.toLocaleString()}</div>
              <div className={`text-xs font-medium ${sym.change >= 0 ? 'text-tv-success' : 'text-tv-error'}`}>
                {sym.change >= 0 ? '+' : ''}{sym.change}%
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Trading Interface - Multi-panel Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 h-[calc(100vh-280px)] min-h-[600px]">
        {/* Left Panel - Watchlist & Market Data */}
        <div className="xl:col-span-2 space-y-4">
          {/* Watchlist */}
          <div className="tv-card p-4 h-64">
            <h3 className="text-sm font-semibold text-tv-text mb-3 uppercase tracking-wide">Watchlist</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {symbols.map((sym) => (
                <div key={sym.symbol} className="flex items-center justify-between py-2 px-2 rounded hover:bg-tv-gray/50 transition-colors">
                  <div>
                    <div className="text-xs font-medium text-tv-text">{sym.symbol}</div>
                    <div className="text-xs text-tv-text-secondary">${sym.price.toLocaleString()}</div>
                  </div>
                  <div className={`text-xs font-medium ${sym.change >= 0 ? 'text-tv-success' : 'text-tv-error'}`}>
                    {sym.change >= 0 ? '+' : ''}{sym.change}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Market Stats */}
          <div className="tv-card p-4">
            <h3 className="text-sm font-semibold text-tv-text mb-3 uppercase tracking-wide">Market Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-tv-text-secondary">24h Volume</span>
                <span className="text-xs font-medium text-tv-text">$2.4B</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-tv-text-secondary">Market Cap</span>
                <span className="text-xs font-medium text-tv-text">$850B</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-tv-text-secondary">BTC Dominance</span>
                <span className="text-xs font-medium text-tv-text">52.3%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Panel - Main Chart */}
        <div className="xl:col-span-7">
          <div className="tv-card p-4 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-tv-text">{selectedSymbol} Chart</h2>
              <div className="flex gap-1">
                {['1m', '5m', '15m', '1H', '4H', '1D', '1W'].map((tf) => (
                  <button
                    key={tf}
                    className="tv-button px-3 py-1 text-xs"
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <CryptoChart symbol={selectedSymbol} height="100%" />
            </div>
          </div>
        </div>

        {/* Right Panel - Trading Tools */}
        <div className="xl:col-span-3 space-y-4">
          {/* AI Signal Card */}
          <AISignalCard signal={aiSignal} />

          {/* Trading Terminal */}
          <TradingTerminal />

          {/* Order Book */}
          <OrderBook symbol={selectedSymbol} />

          {/* Market Depth */}
          <MarketDepth symbol={selectedSymbol} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;