import React from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Chart from './components/Chart';
import OrderBook from './components/OrderBook';
import TradingPanel from './components/TradingPanel';
import Portfolio from './components/Portfolio';

function App() {
  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <Chart />
        <div className="flex flex-col">
          <OrderBook />
          <TradingPanel />
          <Portfolio />
        </div>
      </div>
    </div>
  );
}

export default App;