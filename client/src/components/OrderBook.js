import React, { useState, useEffect } from 'react';

const OrderBook = ({ symbol = 'BTC/USDT' }) => {
  const [orderBook, setOrderBook] = useState({
    bids: [
      { price: 43235, size: 3.2, total: 138.4 },
      { price: 43230, size: 2.1, total: 90.8 },
      { price: 43225, size: 1.8, total: 77.8 },
      { price: 43220, size: 4.5, total: 194.5 },
      { price: 43215, size: 2.9, total: 125.4 },
    ],
    asks: [
      { price: 43240, size: 2.5, total: 108.1 },
      { price: 43245, size: 1.8, total: 77.8 },
      { price: 43250, size: 3.1, total: 134.0 },
      { price: 43255, size: 2.3, total: 99.5 },
      { price: 43260, size: 1.7, total: 73.5 },
    ],
    spread: 5,
    spreadPercent: 0.012
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setOrderBook(prev => ({
        ...prev,
        bids: prev.bids.map(bid => ({
          ...bid,
          size: bid.size + (Math.random() - 0.5) * 0.1
        })),
        asks: prev.asks.map(ask => ({
          ...ask,
          size: ask.size + (Math.random() - 0.5) * 0.1
        }))
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const maxBidSize = Math.max(...orderBook.bids.map(b => b.size));
  const maxAskSize = Math.max(...orderBook.asks.map(a => a.size));

  return (
    <div className="tv-card p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-tv-text uppercase tracking-wide">Order Book</h3>
        <span className="text-xs text-tv-text-secondary">{symbol}</span>
      </div>

      {/* Header */}
      <div className="grid grid-cols-3 gap-2 text-xs text-tv-text-secondary mb-2 uppercase tracking-wide">
        <span>Price</span>
        <span className="text-right">Size</span>
        <span className="text-right">Total</span>
      </div>

      {/* Asks (Sell Orders) */}
      <div className="flex-1 overflow-hidden">
        <div className="space-y-0.5 max-h-32 overflow-y-auto">
          {orderBook.asks.slice().reverse().map((ask, index) => (
            <div
              key={`ask-${index}`}
              className="grid grid-cols-3 gap-2 text-xs py-0.5 px-1 rounded relative hover:bg-tv-gray/30 transition-colors cursor-pointer"
            >
              {/* Background bar for volume visualization */}
              <div
                className="absolute inset-0 bg-tv-error/10 rounded"
                style={{ width: `${(ask.size / maxAskSize) * 100}%` }}
              />
              <span className="text-tv-error font-medium relative z-10">
                {ask.price.toLocaleString()}
              </span>
              <span className="text-right text-tv-text relative z-10">
                {ask.size.toFixed(1)}
              </span>
              <span className="text-right text-tv-text-secondary relative z-10">
                {ask.total.toFixed(1)}
              </span>
            </div>
          ))}
        </div>

        {/* Spread */}
        <div className="my-2 py-1 px-2 bg-tv-accent/10 rounded text-center">
          <div className="text-xs text-tv-text-secondary">
            Spread: <span className="text-tv-text font-medium">${orderBook.spread}</span>
            <span className="text-tv-text-secondary ml-1">({orderBook.spreadPercent.toFixed(3)}%)</span>
          </div>
        </div>

        {/* Bids (Buy Orders) */}
        <div className="space-y-0.5 max-h-32 overflow-y-auto">
          {orderBook.bids.map((bid, index) => (
            <div
              key={`bid-${index}`}
              className="grid grid-cols-3 gap-2 text-xs py-0.5 px-1 rounded relative hover:bg-tv-gray/30 transition-colors cursor-pointer"
            >
              {/* Background bar for volume visualization */}
              <div
                className="absolute inset-0 bg-tv-success/10 rounded"
                style={{ width: `${(bid.size / maxBidSize) * 100}%` }}
              />
              <span className="text-tv-success font-medium relative z-10">
                {bid.price.toLocaleString()}
              </span>
              <span className="text-right text-tv-text relative z-10">
                {bid.size.toFixed(1)}
              </span>
              <span className="text-right text-tv-text-secondary relative z-10">
                {bid.total.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer stats */}
      <div className="mt-3 pt-3 border-t border-tv-border">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-tv-text-secondary">Bid Volume: </span>
            <span className="text-tv-text font-medium">
              {orderBook.bids.reduce((sum, bid) => sum + bid.size, 0).toFixed(1)}
            </span>
          </div>
          <div>
            <span className="text-tv-text-secondary">Ask Volume: </span>
            <span className="text-tv-text font-medium">
              {orderBook.asks.reduce((sum, ask) => sum + ask.size, 0).toFixed(1)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderBook;