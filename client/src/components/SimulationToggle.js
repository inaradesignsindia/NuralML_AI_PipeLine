import React from 'react';
import { useSimulation } from '../contexts/SimulationContext';

const SimulationToggle = () => {
  const {
    isSimulationMode,
    simulationStatus,
    startSimulation,
    stopSimulation,
    resetSimulation,
    isLoading,
    error
  } = useSimulation();

  const handleToggle = async () => {
    try {
      if (isSimulationMode) {
        await stopSimulation();
      } else {
        await startSimulation();
      }
    } catch (err) {
      console.error('Simulation toggle error:', err);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Reset simulation? This will clear all virtual trades and positions.')) {
      try {
        await resetSimulation();
      } catch (err) {
        console.error('Simulation reset error:', err);
      }
    }
  };

  return (
    <div className="flex items-center space-x-3">
      {/* Simulation Mode Toggle */}
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-400">
          {isSimulationMode ? 'Simulation' : 'Live'}
        </span>
        <button
          onClick={handleToggle}
          disabled={isLoading}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            isSimulationMode ? 'bg-blue-600' : 'bg-gray-600'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isSimulationMode ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Simulation Status */}
      {isSimulationMode && (
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <span className="text-gray-400">Balance:</span>
            <span className="text-green-400 font-semibold">
              ${simulationStatus.balance?.toFixed(2) || '0.00'}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <span className="text-gray-400">P&L:</span>
            <span className={`font-semibold ${
              (simulationStatus.totalPnL || 0) >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {(simulationStatus.totalPnL || 0) >= 0 ? '+' : ''}
              ${(simulationStatus.totalPnL || 0).toFixed(2)}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <span className="text-gray-400">Trades:</span>
            <span className="text-blue-400 font-semibold">
              {simulationStatus.tradeCount || 0}
            </span>
          </div>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            disabled={isLoading}
            className="px-2 py-1 text-xs bg-red-600/50 hover:bg-red-600 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Reset Simulation"
          >
            Reset
          </button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="text-xs text-red-400 bg-red-900/20 px-2 py-1 rounded">
          {error}
        </div>
      )}
    </div>
  );
};

export default SimulationToggle;