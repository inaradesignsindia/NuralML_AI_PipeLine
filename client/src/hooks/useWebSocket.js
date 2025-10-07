import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const useWebSocket = (url = 'http://localhost:5000') => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [marketData, setMarketData] = useState({});
  const [aiSignals, setAiSignals] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io(url, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    // Connection events
    socketInstance.on('connect', () => {
      console.log('Connected to WebSocket server');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setIsConnected(false);
    });

    // Market data updates
    socketInstance.on('marketData', (data) => {
      setMarketData(prev => ({
        ...prev,
        [data.symbol]: {
          ...prev[data.symbol],
          ...data,
          timestamp: new Date()
        }
      }));
    });

    // AI signal updates
    socketInstance.on('aiSignal', (signal) => {
      setAiSignals(prev => [signal, ...prev.slice(0, 9)]); // Keep last 10 signals
    });

    // Alert notifications
    socketInstance.on('alert', (alert) => {
      setAlerts(prev => [alert, ...prev.slice(0, 49)]); // Keep last 50 alerts
    });

    // Order updates
    socketInstance.on('orderUpdate', (order) => {
      console.log('Order update:', order);
      // Handle order updates
    });

    // Position updates
    socketInstance.on('positionUpdate', (position) => {
      console.log('Position update:', position);
      // Handle position updates
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      socketInstance.disconnect();
    };
  }, [url]);

  // Send messages to server
  const sendMessage = (event, data) => {
    if (socket && isConnected) {
      socket.emit(event, data);
    }
  };

  // Subscribe to symbol
  const subscribeToSymbol = (symbol) => {
    sendMessage('subscribe', { symbol });
  };

  // Unsubscribe from symbol
  const unsubscribeFromSymbol = (symbol) => {
    sendMessage('unsubscribe', { symbol });
  };

  // Place order
  const placeOrder = (orderData) => {
    sendMessage('placeOrder', orderData);
  };

  // Cancel order
  const cancelOrder = (orderId) => {
    sendMessage('cancelOrder', { orderId });
  };

  // Get alert history
  const getAlertHistory = () => {
    sendMessage('get-alert-history', { limit: 50 });
  };

  // Dismiss alert
  const dismissAlert = (alertId) => {
    sendMessage('dismiss-alert', { alertId });
  };

  return {
    socket,
    isConnected,
    marketData,
    aiSignals,
    alerts,
    sendMessage,
    subscribeToSymbol,
    unsubscribeFromSymbol,
    placeOrder,
    cancelOrder,
    getAlertHistory,
    dismissAlert,
  };
};

export default useWebSocket;