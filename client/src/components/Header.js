import React from 'react';

function Header() {
  return (
    <header className="bg-gray-800 h-16 flex items-center justify-between px-4">
      <div className="text-xl font-bold">NuralML SpotAI</div>
      <nav className="flex space-x-4">
        <a href="#" className="text-gray-300 hover:text-white">Dashboard</a>
        <a href="#" className="text-gray-300 hover:text-white">Settings</a>
        <a href="#" className="text-gray-300 hover:text-white">Logout</a>
      </nav>
    </header>
  );
}

export default Header;