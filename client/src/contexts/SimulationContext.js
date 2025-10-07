import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SimulationContext = createContext();

export const useSimulation = () => {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
};

export const SimulationProvider = ({ children }) => {
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [simulationStatus, setSimulationStatus] = useState({
    isActive: false,
    balance: 0,
    totalValue: 0,
    totalPnL: 0,
    positions: [],
    tradeCount: 0
  });
  const [performanceData, setPerformanceData] = useState(null);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // API base URL
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  // Fetch simulation status
  const fetchSimulationStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/simulation/portfolio`);
      if (!response.ok) {
        throw new Error('Failed to fetch simulation status');
      }
      const data = await response.json();
      setSimulationStatus(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching simulation status:', err);
    }
  }, [API_BASE]);

  // Start simulation
  const startSimulation = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/simulation/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to start simulation');
      }

      const result = await response.json();
      setIsSimulationMode(true);
      await fetchSimulationStatus();
      setError(null);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Stop simulation
  const stopSimulation = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/simulation/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to stop simulation');
      }

      const result = await response.json();
      setIsSimulationMode(false);
      await fetchSimulationStatus();
      setError(null);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Reset simulation
  const resetSimulation = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/simulation/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to reset simulation');
      }

      const result = await response.json();
      await fetchSimulationStatus();
      await fetchPerformanceData();
      await fetchTradeHistory();
      setError(null);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch performance data
  const fetchPerformanceData = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/simulation/performance`);
      if (!response.ok) {
        throw new Error('Failed to fetch performance data');
      }
      const data = await response.json();
      setPerformanceData(data);
    } catch (err) {
      console.error('Error fetching performance data:', err);
    }
  }, [API_BASE]);

  // Fetch trade history
  const fetchTradeHistory = useCallback(async (limit = 50) => {
    try {
      const response = await fetch(`${API_BASE}/api/simulation/trades?limit=${limit}`);
      if (!response.ok) {
        throw new Error('Failed to fetch trade history');
      }
      const data = await response.json();
      setTradeHistory(data.trades || []);
    } catch (err) {
      console.error('Error fetching trade history:', err);
    }
  }, [API_BASE]);

  // Execute AI trade in simulation
  const executeAITrade = async (symbol, marketContext, accountBalance) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/simulation/execute-ai-trade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol,
          marketContext,
          accountBalance
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to execute AI trade');
      }

      const result = await response.json();
      await fetchSimulationStatus();
      await fetchTradeHistory();
      setError(null);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Execute manual trade in simulation
  const executeManualTrade = async (trade) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/simulation/execute-manual-trade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trade }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to execute manual trade');
      }

      const result = await response.json();
      await fetchSimulationStatus();
      await fetchTradeHistory();
      setError(null);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Close position
  const closePosition = async (positionKey, exitPrice) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/simulation/close-position`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ positionKey, exitPrice }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to close position');
      }

      const result = await response.json();
      await fetchSimulationStatus();
      await fetchTradeHistory();
      setError(null);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh simulation data when in simulation mode
  useEffect(() => {
    let interval;
    if (isSimulationMode) {
      interval = setInterval(() => {
        fetchSimulationStatus();
      }, 5000); // Refresh every 5 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSimulationMode, fetchSimulationStatus]);

  // Initial data fetch
  useEffect(() => {
    fetchSimulationStatus();
    fetchPerformanceData();
    fetchTradeHistory();
  }, [fetchSimulationStatus, fetchPerformanceData, fetchTradeHistory]);

  const value = {
    // State
    isSimulationMode,
    simulationStatus,
    performanceData,
    tradeHistory,
    isLoading,
    error,

    // Actions
    startSimulation,
    stopSimulation,
    resetSimulation,
    executeAITrade,
    executeManualTrade,
    closePosition,
    fetchSimulationStatus,
    fetchPerformanceData,
    fetchTradeHistory,
  };

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  );
};