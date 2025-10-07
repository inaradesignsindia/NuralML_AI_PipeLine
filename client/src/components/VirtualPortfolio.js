import React from 'react';
import { useSimulation } from '../contexts/SimulationContext';

const VirtualPortfolio = () => {
  const { isSimulationMode, simulationStatus } = useSimulation();

  if (!isSimulationMode) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Virtual Portfolio</h2>
          <p className="text-gray-400 mt-1">Simulation trading dashboard</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-green-400">Simulation Active</span>
        </div>
      </div>

      <div className="glass-card p-6 rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Virtual Balance</p>
                <p className="text-2xl font-bold text-green-400">
                  ${simulationStatus.balance?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total P&L</p>
                <p className={`text-2xl font-bold ${
                  (simulationStatus.totalPnL || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {(simulationStatus.totalPnL || 0) >= 0 ? '+' : ''}
                  ${(simulationStatus.totalPnL || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Value</p>
                <p className="text-2xl font-bold text-blue-400">
                  ${simulationStatus.totalValue?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Trades</p>
                <p className="text-2xl font-bold text-purple-400">
                  {simulationStatus.tradeCount || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VirtualPortfolio;