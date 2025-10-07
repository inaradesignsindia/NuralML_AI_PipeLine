import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const Settings = () => {
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState('api-keys');
  const [apiKeys, setApiKeys] = useState({
    binance: { apiKey: '', secretKey: '', status: 'disconnected' },
    delta: { apiKey: '', secretKey: '', status: 'disconnected' },
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [riskSettings, setRiskSettings] = useState({
    maxPositionSize: 10000,
    maxDailyLoss: 5000,
    stopLossPercentage: 2,
    takeProfitPercentage: 5,
    maxOpenPositions: 5,
  });

  const [alertSettings, setAlertSettings] = useState({
    volatilitySpikeThreshold: 50,
    sentimentShiftThreshold: 20,
    priceGapThreshold: 10,
    enableVolatilityAlerts: true,
    enableSentimentAlerts: true,
    enablePriceGapAlerts: true,
    enableWebSocketAlerts: true,
    enableEmailAlerts: false, // For future email implementation
  });

  const handleApiKeyChange = (exchange, field, value) => {
    setApiKeys(prev => ({
      ...prev,
      [exchange]: {
        ...prev[exchange],
        [field]: value
      }
    }));
  };

  // Load user's API keys on component mount
  useEffect(() => {
    if (isAuthenticated) {
      loadApiKeys();
    }
  }, [isAuthenticated]);

  const loadApiKeys = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/user/api-keys');
      const userApiKeys = response.data;

      // Update state with loaded keys
      const updatedKeys = { ...apiKeys };
      userApiKeys.forEach(key => {
        if (updatedKeys[key.exchange]) {
          updatedKeys[key.exchange] = {
            apiKey: key.api_key,
            secretKey: key.secret_key,
            status: key.status === 'configured' ? 'connected' : 'disconnected'
          };
        }
      });
      setApiKeys(updatedKeys);
    } catch (error) {
      console.error('Failed to load API keys:', error);
      setMessage('Failed to load API keys');
    }
  };

  const saveApiKeys = async (exchange) => {
    setLoading(true);
    setMessage('');

    try {
      const keyData = apiKeys[exchange];
      await axios.post('http://localhost:3001/api/user/api-keys', {
        exchange,
        apiKey: keyData.apiKey,
        secretKey: keyData.secretKey
      });

      setMessage(`${exchange} API keys saved successfully`);
      // Reload keys to get updated status
      await loadApiKeys();
    } catch (error) {
      console.error('Failed to save API keys:', error);
      setMessage(`Failed to save ${exchange} API keys`);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async (exchange) => {
    setApiKeys(prev => ({
      ...prev,
      [exchange]: {
        ...prev[exchange],
        status: 'connecting'
      }
    }));

    try {
      const response = await axios.post('http://localhost:3001/api/user/api-keys/test', {
        exchange
      });

      setApiKeys(prev => ({
        ...prev,
        [exchange]: {
          ...prev[exchange],
          status: response.data.valid ? 'connected' : 'error'
        }
      }));

      setMessage(response.data.message);
    } catch (error) {
      console.error('Connection test failed:', error);
      setApiKeys(prev => ({
        ...prev,
        [exchange]: {
          ...prev[exchange],
          status: 'error'
        }
      }));
      setMessage('Connection test failed');
    }
  };

  const deleteApiKeys = async (exchange) => {
    if (!window.confirm(`Are you sure you want to delete ${exchange} API keys?`)) {
      return;
    }

    setLoading(true);
    try {
      await axios.delete(`http://localhost:3001/api/user/api-keys/${exchange}`);
      setMessage(`${exchange} API keys deleted successfully`);

      // Clear the keys from state
      setApiKeys(prev => ({
        ...prev,
        [exchange]: {
          apiKey: '',
          secretKey: '',
          status: 'disconnected'
        }
      }));
    } catch (error) {
      console.error('Failed to delete API keys:', error);
      setMessage(`Failed to delete ${exchange} API keys`);
    } finally {
      setLoading(false);
    }
  };

  const handleRiskChange = (field, value) => {
    setRiskSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAlertChange = (field, value) => {
    setAlertSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const renderSettingsContent = () => {
    switch (activeTab) {
      case 'api-keys':
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-white">Exchange API Keys</h3>
            <p className="text-gray-400">Configure your exchange API keys for automated trading</p>

            {Object.entries(apiKeys).map(([exchange, config]) => (
              <div key={exchange} className="glass-card p-6 rounded-xl">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold text-white capitalize">{exchange}</h4>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      config.status === 'connected' ? 'bg-green-600 text-white' :
                      config.status === 'connecting' ? 'bg-yellow-600 text-white' :
                      config.status === 'error' ? 'bg-red-600 text-white' :
                      'bg-gray-600 text-white'
                    }`}>
                      {config.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">API Key</label>
                    <input
                      type="password"
                      value={config.apiKey}
                      onChange={(e) => handleApiKeyChange(exchange, 'apiKey', e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter API Key"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Secret Key</label>
                    <input
                      type="password"
                      value={config.secretKey}
                      onChange={(e) => handleApiKeyChange(exchange, 'secretKey', e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter Secret Key"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => testConnection(exchange)}
                    disabled={config.status === 'connecting' || loading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    {config.status === 'connecting' ? 'Testing...' : 'Test Connection'}
                  </button>
                  <button
                    onClick={() => saveApiKeys(exchange)}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    {loading ? 'Saving...' : 'Save Keys'}
                  </button>
                  {config.status === 'connected' && (
                    <button
                      onClick={() => deleteApiKeys(exchange)}
                      disabled={loading}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        );

      case 'risk-management':
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-white">Risk Management</h3>
            <p className="text-gray-400">Configure risk parameters for automated trading</p>

            <div className="glass-card p-6 rounded-xl space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Max Position Size ($)
                  </label>
                  <input
                    type="number"
                    value={riskSettings.maxPositionSize}
                    onChange={(e) => handleRiskChange('maxPositionSize', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Max Daily Loss ($)
                  </label>
                  <input
                    type="number"
                    value={riskSettings.maxDailyLoss}
                    onChange={(e) => handleRiskChange('maxDailyLoss', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Stop Loss (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={riskSettings.stopLossPercentage}
                    onChange={(e) => handleRiskChange('stopLossPercentage', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Take Profit (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={riskSettings.takeProfitPercentage}
                    onChange={(e) => handleRiskChange('takeProfitPercentage', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Max Open Positions
                  </label>
                  <input
                    type="number"
                    value={riskSettings.maxOpenPositions}
                    onChange={(e) => handleRiskChange('maxOpenPositions', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-700">
                <button className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-md transition-colors">
                  Save Risk Settings
                </button>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-white">Notifications & Alerts</h3>
            <p className="text-gray-400">Configure alerts and notification preferences</p>

            {/* Alert Thresholds */}
            <div className="glass-card p-6 rounded-xl space-y-6">
              <h4 className="text-lg font-semibold text-white">Alert Thresholds</h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Volatility Spike Threshold (%)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="200"
                    value={alertSettings.volatilitySpikeThreshold}
                    onChange={(e) => handleAlertChange('volatilitySpikeThreshold', parseInt(e.target.value))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Alert when volatility increases by this percentage</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Sentiment Shift Threshold (%)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="100"
                    value={alertSettings.sentimentShiftThreshold}
                    onChange={(e) => handleAlertChange('sentimentShiftThreshold', parseInt(e.target.value))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Alert when sentiment changes by this percentage</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Price Gap Threshold (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="50"
                    value={alertSettings.priceGapThreshold}
                    onChange={(e) => handleAlertChange('priceGapThreshold', parseFloat(e.target.value))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Alert on sudden price changes above this threshold</p>
                </div>
              </div>
            </div>

            {/* Alert Types */}
            <div className="glass-card p-6 rounded-xl space-y-4">
              <h4 className="text-lg font-semibold text-white">Alert Types</h4>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-medium">Volatility Spike Alerts</h4>
                  <p className="text-sm text-gray-400">Get notified when volatility spikes occur</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alertSettings.enableVolatilityAlerts}
                    onChange={(e) => handleAlertChange('enableVolatilityAlerts', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-medium">Sentiment Shift Alerts</h4>
                  <p className="text-sm text-gray-400">Alerts for significant sentiment changes</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alertSettings.enableSentimentAlerts}
                    onChange={(e) => handleAlertChange('enableSentimentAlerts', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-medium">Price Gap Alerts</h4>
                  <p className="text-sm text-gray-400">Notifications for sudden price movements</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alertSettings.enablePriceGapAlerts}
                    onChange={(e) => handleAlertChange('enablePriceGapAlerts', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-medium">WebSocket Real-time Alerts</h4>
                  <p className="text-sm text-gray-400">Enable real-time alerts via WebSocket</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alertSettings.enableWebSocketAlerts}
                    onChange={(e) => handleAlertChange('enableWebSocketAlerts', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-gray-700">
              <button className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-md transition-colors">
                Save Alert Settings
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">⚙️ Settings</h1>
        <p className="text-gray-400 mt-1">Configure your trading preferences and API connections</p>
      </div>

      {/* Settings Navigation */}
      <div className="glass-card p-4 rounded-xl">
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setActiveTab('api-keys')}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'api-keys'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            🔑 API Keys
          </button>
          <button
            onClick={() => setActiveTab('risk-management')}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'risk-management'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            🛡️ Risk Management
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'notifications'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            🔔 Notifications
          </button>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`glass-card p-4 rounded-xl ${
          message.includes('success') ? 'bg-green-900/20 border border-green-700' :
          message.includes('Failed') || message.includes('failed') ? 'bg-red-900/20 border border-red-700' :
          'bg-blue-900/20 border border-blue-700'
        }`}>
          <p className="text-white">{message}</p>
        </div>
      )}

      {/* Settings Content */}
      <div className="glass-card p-6 rounded-xl">
        {renderSettingsContent()}
      </div>
    </div>
  );
};

export default Settings;