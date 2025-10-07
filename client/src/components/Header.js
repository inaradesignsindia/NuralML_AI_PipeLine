import React from 'react';
import LoginButton from './LoginButton';
import SimulationToggle from './SimulationToggle';

const Header = ({ setSidebarOpen }) => {

  return (
    <header className="lg:hidden flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
      <button
        onClick={() => setSidebarOpen(true)}
        className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold">N</span>
        </div>
        <span className="text-xl font-bold text-white">NuralML</span>
      </div>

      <div className="flex items-center space-x-4">
        <SimulationToggle />
        <LoginButton />
      </div>
    </header>
  );
};

export default Header;