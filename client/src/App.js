import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { SimulationProvider } from './contexts/SimulationContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import NotificationSystem from './components/NotificationSystem';
import Dashboard from './pages/Dashboard';
import AIQuantAnalysis from './pages/AIQuantAnalysis';
import UnifiedTrading from './pages/UnifiedTrading';
import Backtesting from './pages/Backtesting';
import Settings from './pages/Settings';
import AuthCallback from './pages/AuthCallback';
import useWebSocket from './hooks/useWebSocket';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SimulationProvider>
          <Router>
            <AppContent />
          </Router>
        </SimulationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  const { isDark } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { alerts, dismissAlert, getAlertHistory } = useWebSocket();

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="lg:pl-64">
        <Header setSidebarOpen={setSidebarOpen} />
        <main className="p-4 lg:p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/ai-quant" element={<AIQuantAnalysis />} />
            <Route path="/unified-trading" element={<UnifiedTrading />} />
            <Route path="/backtesting" element={<Backtesting />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
          </Routes>
        </main>
      </div>
      <NotificationSystem
        alerts={alerts}
        onDismiss={dismissAlert}
        onGetHistory={getAlertHistory}
      />
    </div>
  );
}

export default App;
