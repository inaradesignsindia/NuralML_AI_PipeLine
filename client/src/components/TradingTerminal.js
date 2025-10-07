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
    <div className="tv-card p-4">
      <h3 className="text-sm font-semibold text-tv-text mb-4 uppercase tracking-wide">Trading Terminal</h3>

      {/* Symbol Selection */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-tv-text-secondary mb-2 uppercase tracking-wide">
          Symbol
        </label>
        <select
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="tv-input w-full p-2 text-sm"
        >
          <option value="BTC/USDT">BTC/USDT</option>
          <option value="ETH/USDT">ETH/USDT</option>
          <option value="ADA/USDT">ADA/USDT</option>
          <option value="SOL/USDT">SOL/USDT</option>
        </select>
      </div>

      {/* Order Type */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-tv-text-secondary mb-2 uppercase tracking-wide">
          Order Type
        </label>
        <div className="grid grid-cols-3 gap-1">
          {['market', 'limit', 'stop'].map((type) => (
            <button
              key={type}
              onClick={() => setOrderType(type)}
              className={`tv-button py-2 px-3 text-xs font-medium ${
                orderType === type ? 'tv-button-active' : ''
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Quantity */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-tv-text-secondary mb-2 uppercase tracking-wide">
          Quantity
        </label>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="0.00"
          className="tv-input w-full p-2 text-sm"
        />
      </div>

      {/* Price (for limit orders) */}
      {orderType === 'limit' && (
        <div className="mb-4">
          <label className="block text-xs font-medium text-tv-text-secondary mb-2 uppercase tracking-wide">
            Price
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            className="tv-input w-full p-2 text-sm"
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => handleOrder('buy')}
          className="bg-tv-success hover:bg-opacity-80 text-white font-semibold py-3 px-4 rounded text-sm transition-all duration-200 hover:shadow-md transform hover:scale-[1.02]"
        >
          BUY
        </button>
        <button
          onClick={() => handleOrder('sell')}
          className="bg-tv-error hover:bg-opacity-80 text-white font-semibold py-3 px-4 rounded text-sm transition-all duration-200 hover:shadow-md transform hover:scale-[1.02]"
        >
          SELL
        </button>
      </div>

      {/* Position Summary */}
      <div className="pt-3 border-t border-tv-border">
        <h4 className="text-xs font-medium text-tv-text-secondary mb-3 uppercase tracking-wide">Current Position</h4>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-tv-text-secondary">Symbol:</span>
            <span className="text-tv-text font-medium">{symbol}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-tv-text-secondary">Position:</span>
            <span className="text-tv-success font-medium">+0.5 BTC</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-tv-text-secondary">Avg Price:</span>
            <span className="text-tv-text font-medium">$43,250</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-tv-text-secondary">P&L:</span>
            <span className="text-tv-success font-medium">+$1,250</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingTerminal;