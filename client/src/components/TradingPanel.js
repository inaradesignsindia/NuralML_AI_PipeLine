import React from 'react';

function TradingPanel() {
  return (
    <div className="bg-gray-700 p-4 w-80">
      <h3 className="text-lg font-semibold mb-4">Trading Panel</h3>
      <div className="space-y-4">
        <input type="number" placeholder="Amount" className="w-full p-2 bg-gray-600 rounded" />
        <button className="w-full bg-green-600 p-2 rounded">Buy</button>
        <button className="w-full bg-red-600 p-2 rounded">Sell</button>
      </div>
    </div>
  );
}

export default TradingPanel;