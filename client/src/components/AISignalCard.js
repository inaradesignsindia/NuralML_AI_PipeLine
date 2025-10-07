import React from 'react';

const AISignalCard = ({ signal }) => {
  const getSignalColor = (signal) => {
    switch (signal.toLowerCase()) {
      case 'bullish':
        return 'text-green-400 border-green-500';
      case 'bearish':
        return 'text-red-400 border-red-500';
      default:
        return 'text-yellow-400 border-yellow-500';
    }
  };

  const getBgColor = (signal) => {
    switch (signal.toLowerCase()) {
      case 'bullish':
        return 'bg-green-500';
      case 'bearish':
        return 'bg-red-500';
      default:
        return 'bg-yellow-500';
    }
  };

  return (
    <div className={`glass-card p-6 rounded-xl border ${getSignalColor(signal.signal)}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">AI Trading Signal</h3>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold ${getSignalColor(signal.signal)}`}>
              {signal.signal}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getBgColor(signal.signal)} text-white`}>
              {signal.confidence}% confidence
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">Target Symbol</div>
          <div className="text-white font-semibold">{signal.symbol}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <p className="text-sm text-gray-400">Entry Price</p>
          <p className="text-xl font-mono font-bold text-white">
            ${signal.entryPrice?.toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-400">Target Price</p>
          <p className="text-xl font-mono font-bold text-green-400">
            ${signal.targetPrice?.toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-400">Stop Loss</p>
          <p className="text-xl font-mono font-bold text-red-400">
            ${signal.stopLoss?.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-sm text-gray-400 mb-2">Strategy Rationale:</div>
        <div className="text-sm text-gray-300 bg-gray-800 p-3 rounded-lg">
          {signal.rationale}
        </div>
      </div>

      <div className="flex gap-3">
        <button className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors">
          Execute Buy Order
        </button>
        <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors">
          View Details
        </button>
      </div>
    </div>
  );
};

export default AISignalCard;