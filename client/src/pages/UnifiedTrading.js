import React, { useState } from 'react';

const UnifiedTrading = () => {
  const [activeTab, setActiveTab] = useState('positions');
  const [broker, setBroker] = useState('');
  const [symbol, setSymbol] = useState('BANKNIFTY');
  const [quantity, setQuantity] = useState('35');
  const [orderType, setOrderType] = useState('Market');

  const tabs = [
    { id: 'positions', label: 'Positions', count: 2 },
    { id: 'orders', label: 'Order Book', count: 0 },
    { id: 'trades', label: 'Trade Book', count: 5 },
    { id: 'holdings', label: 'Holdings', count: 0 },
    { id: 'funds', label: 'Funds', count: 0 },
  ];

  const positions = [
    {
      symbol: 'BANKNIFTY 251028 CE',
      qty: 35,
      avgPrice: 798.80,
      ltp: 815.50,
      pnl: 588.50,
      type: 'CE'
    },
    {
      symbol: 'BANKNIFTY 251028 PE',
      qty: -25,
      avgPrice: 441.00,
      ltp: 425.75,
      pnl: 381.25,
      type: 'PE'
    }
  ];

  const trades = [
    { time: '09:15:30', symbol: 'BANKNIFTY CE', qty: 35, price: 798.80, type: 'BUY' },
    { time: '09:16:45', symbol: 'BANKNIFTY PE', qty: 25, price: 441.00, type: 'SELL' },
    { time: '09:18:20', symbol: 'BANKNIFTY CE', qty: 15, price: 805.25, type: 'BUY' },
    { time: '09:22:10', symbol: 'BANKNIFTY PE', qty: 10, price: 435.50, type: 'SELL' },
    { time: '09:25:05', symbol: 'BANKNIFTY CE', qty: 20, price: 812.00, type: 'BUY' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'positions':
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-gray-800">
                  <th className="p-3">☑</th>
                  <th className="p-3">Symbol</th>
                  <th className="p-3">Qty</th>
                  <th className="p-3">Avg Price</th>
                  <th className="p-3">LTP</th>
                  <th className="p-3">P&L</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((pos, index) => (
                  <tr key={index} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-3">
                      <input type="checkbox" className="rounded" />
                    </td>
                    <td className="p-3 font-semibold text-white">
                      {pos.symbol} <span className="text-xs text-gray-500">({pos.type})</span>
                    </td>
                    <td className="p-3">{pos.qty}</td>
                    <td className="p-3">{pos.avgPrice.toFixed(2)}</td>
                    <td className="p-3">{pos.ltp.toFixed(2)}</td>
                    <td className={`p-3 font-semibold ${pos.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {pos.pnl >= 0 ? '+' : ''}{pos.pnl.toFixed(2)}
                    </td>
                    <td className="p-3">
                      <button className="text-xs bg-red-600/50 hover:bg-red-600 px-3 py-1 rounded">
                        Exit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 flex justify-between items-center text-sm">
              <div>
                <span className="text-gray-400">Total P&L: </span>
                <span className="text-green-400 font-bold">+₹969.75</span>
              </div>
              <div>
                <span className="text-gray-400">MTM: </span>
                <span className="text-blue-400 font-bold">₹1,245.30</span>
              </div>
            </div>
          </div>
        );
      case 'orders':
        return (
          <div className="text-center text-gray-400 p-8">
            No pending orders
          </div>
        );
      case 'trades':
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-gray-800">
                  <th className="p-3">Time</th>
                  <th className="p-3">Symbol</th>
                  <th className="p-3">Qty</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Type</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade, index) => (
                  <tr key={index} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-3 text-gray-400">{trade.time}</td>
                    <td className="p-3 font-semibold text-white">{trade.symbol}</td>
                    <td className="p-3">{trade.qty}</td>
                    <td className="p-3">{trade.price.toFixed(2)}</td>
                    <td className={`p-3 font-semibold ${trade.type === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                      {trade.type}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'holdings':
        return (
          <div className="text-center text-gray-400 p-8">
            Holdings data will appear here
          </div>
        );
      case 'funds':
        return (
          <div className="text-center text-gray-400 p-8">
            Fund details and margin utilization
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">⚡ Unified Trading Terminal</h1>
        <p className="text-gray-400 mt-1">Advanced options and futures trading platform</p>
      </div>

      {/* Control Panel */}
      <div className="glass-card p-6 rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Broker</label>
            <select
              value={broker}
              onChange={(e) => setBroker(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Broker</option>
              <option value="zerodha">Zerodha</option>
              <option value="upstox">Upstox</option>
              <option value="finvasia">Finvasia</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Symbol</label>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="BANKNIFTY">BANKNIFTY</option>
              <option value="NIFTY">NIFTY</option>
              <option value="FINNIFTY">FINNIFTY</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Quantity (Lots)</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Order Type</label>
            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Market">Market</option>
              <option value="Limit">Limit</option>
              <option value="SL">Stop Loss</option>
            </select>
          </div>
        </div>

        {/* Trading Buttons */}
        <div className="flex gap-4 justify-center">
          <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-colors">
            BUY CE
          </button>
          <button className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg transition-colors">
            SELL CE
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-colors">
            BUY PE
          </button>
          <button className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg transition-colors">
            SELL PE
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-card p-6 rounded-xl">
        <div className="flex border-b border-gray-800 mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-6 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-500 hover:text-white'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default UnifiedTrading;