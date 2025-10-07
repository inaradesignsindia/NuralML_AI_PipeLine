import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const { isDark, toggleTheme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: '📊' },
    { name: 'AI Quant', href: '/ai-quant', icon: '🧠' },
    { name: 'Unified Trading', href: '/unified-trading', icon: '⚡' },
    { name: 'Backtesting', href: '/backtesting', icon: '📈' },
    { name: 'Settings', href: '/settings', icon: '⚙️' },
  ];

  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 tv-card border-r border-tv-border`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 border-b border-tv-border">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-tv-accent rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">N</span>
              </div>
              <span className="text-lg font-semibold text-tv-text">NuralML</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200 group ${
                    isActive
                      ? 'bg-tv-accent/20 text-tv-accent border-r-2 border-tv-accent shadow-sm'
                      : 'text-tv-text-secondary hover:bg-tv-gray hover:text-tv-text'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="mr-3 text-base group-hover:scale-110 transition-transform">{item.icon}</span>
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Theme toggle and user info */}
          <div className="p-4 border-t border-tv-border space-y-3">
            <button
              onClick={toggleTheme}
              className="w-full tv-button tv-card-hover flex items-center justify-center px-4 py-2.5 text-sm font-medium"
            >
              <span className="mr-2">{isDark ? '☀️' : '🌙'}</span>
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </button>
            {isAuthenticated && user && (
              <div className="tv-card p-3 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 bg-tv-accent rounded-full flex items-center justify-center shadow-md">
                    <span className="text-white text-sm font-bold">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-tv-text truncate">{user.name || 'User'}</p>
                    <p className="text-xs text-tv-text-secondary truncate">{user.email || 'Authenticated'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;