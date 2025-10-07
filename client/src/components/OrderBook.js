import React from 'react';

function OrderBook() {
  return (
    <div className="bg-gray-700 p-4 w-80">
      <h3 className="text-lg font-semibold mb-4">Order Book</h3>
      <div className="space-y-2">
        <div className="text-green-400">Asks</div>
        <div className="text-red-400">Bids</div>
      </div>
    </div>
  );
}

export default OrderBook;