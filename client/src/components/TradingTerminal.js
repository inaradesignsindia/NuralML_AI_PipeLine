import React, { useState } from 'react';

const TradingTerminal = () => {
  const [orderType, setOrderType] = useState('market');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [symbol, setSymbol] = useState('BTC/USDT');

  const handleOrder = (side) => {
    // In real app, this would send order to backend
    console.log(`${side} order:`, { symbol, quantity, price, orderType });
    alert(`${side.toUpperCase()} order placed successfully!`);
  };

  return (
    <div className="glass-card p-6 rounded-xl">
      <h3 className="text-xl font-semibold text-white mb-6">Trading Terminal</h3>

      {/* Symbol Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Symbol
        </label>
        <select
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="BTC/USDT">BTC/USDT</option>
          <option value="ETH/USDT">ETH/USDT</option>
          <option value="ADA/USDT">ADA/USDT</option>
          <option value="SOL/USDT">SOL/USDT</option>
        </select>
      </div>

      {/* Order Type */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Order Type
        </label>
        <div className="flex gap-2">
          {['market', 'limit', 'stop'].map((type) => (
            <button
              key={type}
              onClick={() => setOrderType(type)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                orderType === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Quantity */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Quantity
        </label>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="0.00"
          className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Price (for limit orders) */}
      {orderType === 'limit' && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Price
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => handleOrder('buy')}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg transition-colors transform hover:scale-105"
        >
          BUY
        </button>
        <button
          onClick={() => handleOrder('sell')}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-lg transition-colors transform hover:scale-105"
        >
          SELL
        </button>
      </div>

      {/* Position Summary */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <h4 className="text-sm font-medium text-gray-400 mb-3">Current Position</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Symbol:</span>
            <span className="text-white">{symbol}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Position:</span>
            <span className="text-green-400">+0.5 BTC</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Avg Price:</span>
            <span className="text-white">$43,250</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">P&L:</span>
            <span className="text-green-400">+$1,250</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingTerminal;