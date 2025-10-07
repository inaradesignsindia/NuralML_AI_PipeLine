import React, { useState, useEffect } from 'react';

const MarketDepth = ({ symbol = 'BTC/USDT' }) => {
  const [depthData, setDepthData] = useState({
    bids: [
      { price: 43235, volume: 15.2, percentage: 85 },
      { price: 43230, volume: 12.8, percentage: 72 },
      { price: 43225, volume: 10.5, percentage: 59 },
      { price: 43220, volume: 8.9, percentage: 50 },
      { price: 43215, volume: 6.7, percentage: 38 },
      { price: 43210, volume: 4.2, percentage: 24 },
      { price: 43205, volume: 2.1, percentage: 12 },
    ],
    asks: [
      { price: 43240, volume: 14.8, percentage: 83 },
      { price: 43245, volume: 11.9, percentage: 67 },
      { price: 43250, volume: 9.3, percentage: 52 },
      { price: 43255, volume: 7.1, percentage: 40 },
      { price: 43260, volume: 5.4, percentage: 30 },
      { price: 43265, volume: 3.6, percentage: 20 },
      { price: 43270, volume: 1.8, percentage: 10 },
    ]
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setDepthData(prev => ({
        bids: prev.bids.map(bid => ({
          ...bid,
          volume: bid.volume + (Math.random() - 0.5) * 0.5
        })),
        asks: prev.asks.map(ask => ({
          ...ask,
          volume: ask.volume + (Math.random() - 0.5) * 0.5
        }))
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const maxBidVolume = Math.max(...depthData.bids.map(b => b.volume));
  const maxAskVolume = Math.max(...depthData.asks.map(a => a.volume));

  return (
    <div className="tv-card p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-tv-text uppercase tracking-wide">Market Depth</h3>
        <span className="text-xs text-tv-text-secondary">{symbol}</span>
      </div>

      <div className="flex-1 space-y-1">
        {/* Asks (Sell side) */}
        <div className="space-y-0.5">
          {depthData.asks.map((ask, index) => (
            <div
              key={`ask-${index}`}
              className="flex items-center justify-between text-xs py-0.5 px-2 rounded hover:bg-tv-gray/30 transition-colors cursor-pointer group"
            >
              {/* Volume bar background */}
              <div
                className="absolute left-0 top-0 bottom-0 bg-tv-error/20 rounded-l"
                style={{ width: `${ask.percentage}%` }}
              />

              {/* Price */}
              <span className="text-tv-error font-medium relative z-10 group-hover:text-tv-error/80">
                {ask.price.toLocaleString()}
              </span>

              {/* Volume */}
              <span className="text-tv-text relative z-10">
                {ask.volume.toFixed(1)}
              </span>

              {/* Percentage */}
              <span className="text-tv-text-secondary relative z-10 w-8 text-right">
                {ask.percentage}%
              </span>
            </div>
          ))}
        </div>

        {/* Current Price Indicator */}
        <div className="flex items-center justify-center py-2 my-2">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-tv-accent rounded-full animate-pulse"></div>
            <span className="text-xs text-tv-text font-medium">43,237.50</span>
            <div className="w-2 h-2 bg-tv-accent rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Bids (Buy side) */}
        <div className="space-y-0.5">
          {depthData.bids.map((bid, index) => (
            <div
              key={`bid-${index}`}
              className="flex items-center justify-between text-xs py-0.5 px-2 rounded hover:bg-tv-gray/30 transition-colors cursor-pointer group"
            >
              {/* Volume bar background */}
              <div
                className="absolute right-0 top-0 bottom-0 bg-tv-success/20 rounded-r"
                style={{ width: `${bid.percentage}%`, left: 'auto' }}
              />

              {/* Price */}
              <span className="text-tv-success font-medium relative z-10 group-hover:text-tv-success/80">
                {bid.price.toLocaleString()}
              </span>

              {/* Volume */}
              <span className="text-tv-text relative z-10">
                {bid.volume.toFixed(1)}
              </span>

              {/* Percentage */}
              <span className="text-tv-text-secondary relative z-10 w-8 text-right">
                {bid.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer stats */}
      <div className="mt-4 pt-3 border-t border-tv-border">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="text-center">
            <span className="text-tv-text-secondary">Bid Wall: </span>
            <span className="text-tv-success font-medium">
              {depthData.bids[0]?.volume.toFixed(1)} @ {depthData.bids[0]?.price.toLocaleString()}
            </span>
          </div>
          <div className="text-center">
            <span className="text-tv-text-secondary">Ask Wall: </span>
            <span className="text-tv-error font-medium">
              {depthData.asks[0]?.volume.toFixed(1)} @ {depthData.asks[0]?.price.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketDepth;