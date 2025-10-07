import React, { useState, useEffect } from 'react';

const NotificationSystem = ({ alerts, onDismiss, onGetHistory }) => {
  const [visibleAlerts, setVisibleAlerts] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    // Show new alerts
    setVisibleAlerts(alerts);
  }, [alerts]);

  const handleDismiss = (alertId) => {
    setVisibleAlerts(prev => prev.filter(alert => alert.id !== alertId));
    onDismiss(alertId);
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'volatility_spike':
        return '📈';
      case 'sentiment_shift':
        return '📊';
      case 'price_gap':
        return '💰';
      default:
        return '⚠️';
    }
  };

  const getAlertColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {/* Current Alerts */}
      {visibleAlerts.slice(0, 3).map((alert) => (
        <div
          key={alert.id}
          className={`max-w-sm bg-white dark:bg-gray-800 rounded-lg shadow-lg border-l-4 ${getAlertColor(alert.severity)} p-4 transform transition-all duration-300 ease-in-out`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className={`p-1 rounded-full ${getAlertColor(alert.severity)} text-white`}>
                {getAlertIcon(alert.type)}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {alert.symbol} Alert
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {alert.message}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatTimestamp(alert.timestamp)}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleDismiss(alert.id)}
              className="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      ))}

      {/* Alert History Toggle */}
      {alerts.length > 0 && (
        <button
          onClick={() => {
            setShowHistory(!showHistory);
            if (!showHistory) onGetHistory();
          }}
          className="bg-gray-800 dark:bg-gray-700 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
        >
          {showHistory ? 'Hide' : 'Show'} Alert History ({alerts.length})
        </button>
      )}

      {/* Alert History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Alert History
                </h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className={`p-1 rounded-full ${getAlertColor(alert.severity)} text-white flex-shrink-0`}>
                      {getAlertIcon(alert.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {alert.symbol}
                        </h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTimestamp(alert.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {alert.message}
                      </p>
                      {alert.data && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {alert.data.change && `Change: ${alert.data.change}%`}
                          {alert.data.changePercent && `Change: ${alert.data.changePercent}%`}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSystem;