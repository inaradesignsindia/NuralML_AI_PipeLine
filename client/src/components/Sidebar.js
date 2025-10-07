import React from 'react';

function Sidebar() {
  return (
    <aside className="bg-gray-800 w-64 h-full p-4">
      <h2 className="text-lg font-semibold mb-4">Watchlist</h2>
      <ul className="space-y-2">
        <li className="text-gray-300 hover:text-white cursor-pointer">BTC/USD</li>
        <li className="text-gray-300 hover:text-white cursor-pointer">ETH/USD</li>
        <li className="text-gray-300 hover:text-white cursor-pointer">ADA/USD</li>
      </ul>
    </aside>
  );
}

export default Sidebar;