import React from 'react';
import LoginButton from './LoginButton';
import SimulationToggle from './SimulationToggle';

const Header = ({ setSidebarOpen }) => {
  // Mock market data - in real app this would come from WebSocket/context
  const marketData = {
    btc: { price: 43250.75, change: 2.98, changePercent: 2.98 },
    eth: { price: 2650.30, change: 1.45, changePercent: 1.45 },
    spx: { price: 4187.50, change: -0.85, changePercent: -0.85 }
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden tv-card border-b border-tv-border p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="tv-button p-2 rounded-md"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-tv-accent rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="text-lg font-semibold text-tv-text">NuralML</span>
          </div>

          <div className="flex items-center space-x-3">
            <SimulationToggle />
            <LoginButton />
          </div>
        </div>
      </header>

      {/* Desktop Market Bar */}
      <header className="hidden lg:block tv-card border-b border-tv-border px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Market Data */}
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-tv-text-secondary">BTC</span>
                <span className="text-sm font-semibold text-tv-text">${marketData.btc.price.toLocaleString()}</span>
                <span className={`text-xs font-medium ${marketData.btc.change >= 0 ? 'text-tv-success' : 'text-tv-error'}`}>
                  {marketData.btc.change >= 0 ? '+' : ''}{marketData.btc.changePercent}%
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-tv-text-secondary">ETH</span>
                <span className="text-sm font-semibold text-tv-text">${marketData.eth.price.toLocaleString()}</span>
                <span className={`text-xs font-medium ${marketData.eth.change >= 0 ? 'text-tv-success' : 'text-tv-error'}`}>
                  {marketData.eth.change >= 0 ? '+' : ''}{marketData.eth.changePercent}%
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-tv-text-secondary">SPX</span>
                <span className="text-sm font-semibold text-tv-text">{marketData.spx.price.toLocaleString()}</span>
                <span className={`text-xs font-medium ${marketData.spx.change >= 0 ? 'text-tv-success' : 'text-tv-error'}`}>
                  {marketData.spx.change >= 0 ? '+' : ''}{marketData.spx.changePercent}%
                </span>
              </div>
            </div>

            {/* Status Indicators */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-tv-success rounded-full tv-pulse"></div>
                <span className="text-xs text-tv-text-secondary">Live</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-tv-accent rounded-full tv-pulse"></div>
                <span className="text-xs text-tv-text-secondary">AI Active</span>
              </div>
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center space-x-4">
            <SimulationToggle />
            <LoginButton />
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;