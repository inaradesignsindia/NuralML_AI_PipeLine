import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, ColorType, LineStyle, CrosshairMode } from 'lightweight-charts';
import { useTheme } from '../contexts/ThemeContext';
import useWebSocket from '../hooks/useWebSocket';
import TechnicalIndicators from '../utils/indicators';

const CryptoChart = ({
  symbol = 'BTC/USDT',
  height = 400,
  timeframe = '1h',
  showVolume = true
}) => {
  const chartContainerRef = useRef();
  const chartRef = useRef();
  const candlestickSeriesRef = useRef();
  const volumeSeriesRef = useRef();
  const indicatorSeriesRef = useRef({});
  const drawingToolsRef = useRef([]);

  const { isDark } = useTheme();
  const { marketData, isConnected } = useWebSocket();

  // Indicator states
  const [indicators, setIndicators] = useState({
    rsi: { enabled: true, period: 14 },
    macd: { enabled: true, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
    bollingerBands: { enabled: true, period: 20, stdDev: 2 },
    volumeProfile: { enabled: false },
    volatility: { enabled: true, hvWindow: 20 }
  });

  // Chart data states
  const [chartData, setChartData] = useState([]);
  const [volumeData, setVolumeData] = useState([]);
  const [indicatorData, setIndicatorData] = useState({});

  // Drawing tools state
  const [drawingMode, setDrawingMode] = useState(null); // 'trendline', 'fibonacci', null
  const [drawings, setDrawings] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingStart, setDrawingStart] = useState(null);

  // Timeframe options
  const timeframes = [
    { label: '1m', value: '1m' },
    { label: '5m', value: '5m' },
    { label: '15m', value: '15m' },
    { label: '1h', value: '1h' },
    { label: '4h', value: '4h' },
    { label: '1d', value: '1d' }
  ];

  // Theme colors
  const getThemeColors = useCallback(() => {
    return isDark ? {
      background: 'transparent',
      text: '#d1d5db',
      grid: '#374151',
      upColor: '#10b981',
      downColor: '#ef4444',
      volumeUp: 'rgba(16, 185, 129, 0.6)',
      volumeDown: 'rgba(239, 68, 68, 0.6)',
      rsi: '#f59e0b',
      macd: '#8b5cf6',
      signal: '#06b6d4',
      histogram: '#10b981',
      bollingerUpper: '#ef4444',
      bollingerLower: '#3b82f6',
      bollingerMiddle: '#f59e0b',
      volatility: '#ec4899'
    } : {
      background: 'transparent',
      text: '#374151',
      grid: '#e5e7eb',
      upColor: '#059669',
      downColor: '#dc2626',
      volumeUp: 'rgba(5, 150, 105, 0.6)',
      volumeDown: 'rgba(220, 38, 38, 0.6)',
      rsi: '#d97706',
      macd: '#7c3aed',
      signal: '#0891b2',
      histogram: '#059669',
      bollingerUpper: '#dc2626',
      bollingerLower: '#2563eb',
      bollingerMiddle: '#d97706',
      volatility: '#db2777'
    };
  }, [isDark]);

  // Generate sample data for demonstration
  const generateSampleData = useCallback((count = 100) => {
    const data = [];
    const basePrice = 45000;
    let currentPrice = basePrice;

    for (let i = 0; i < count; i++) {
      const time = new Date(Date.now() - (count - i) * 3600000); // 1 hour intervals
      const volatility = 0.02;
      const change = (Math.random() - 0.5) * 2 * volatility * currentPrice;

      const open = currentPrice;
      const close = open + change;
      const high = Math.max(open, close) + Math.random() * volatility * currentPrice * 0.5;
      const low = Math.min(open, close) - Math.random() * volatility * currentPrice * 0.5;
      const volume = Math.random() * 100 + 50;

      data.push({
        time: time.toISOString().split('T')[0],
        open: Math.round(open * 100) / 100,
        high: Math.round(high * 100) / 100,
        low: Math.round(low * 100) / 100,
        close: Math.round(close * 100) / 100,
        volume: Math.round(volume * 100) / 100
      });

      currentPrice = close;
    }

    return data;
  }, []);

  // Calculate indicators
  const calculateIndicators = useCallback((data) => {
    if (!data || data.length === 0) return {};

    const closes = data.map(d => d.close);
    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);
    const volumes = data.map(d => d.volume);

    const results = {};

    if (indicators.rsi.enabled) {
      results.rsi = TechnicalIndicators.calculateRSI(closes, indicators.rsi.period);
    }

    if (indicators.macd.enabled) {
      results.macd = TechnicalIndicators.calculateMACD(
        closes,
        indicators.macd.fastPeriod,
        indicators.macd.slowPeriod,
        indicators.macd.signalPeriod
      );
    }

    if (indicators.bollingerBands.enabled) {
      results.bollingerBands = TechnicalIndicators.calculateBollingerBands(
        closes,
        indicators.bollingerBands.period,
        indicators.bollingerBands.stdDev
      );
    }

    if (indicators.volumeProfile.enabled) {
      results.volumeProfile = TechnicalIndicators.calculateVolumeProfile(data);
    }

    if (indicators.volatility.enabled) {
      results.volatility = TechnicalIndicators.calculateHistoricalVolatility(
        closes,
        indicators.volatility.hvWindow
      );
    }

    return results;
  }, [indicators]);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const colors = getThemeColors();

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: colors.background },
        textColor: colors.text,
      },
      grid: {
        vertLines: { color: colors.grid },
        horzLines: { color: colors.grid },
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: colors.grid,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    chartRef.current = chart;

    // Create candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: colors.upColor,
      downColor: colors.downColor,
      borderVisible: false,
      wickUpColor: colors.upColor,
      wickDownColor: colors.downColor,
    });
    candlestickSeriesRef.current = candlestickSeries;

    // Create volume series
    if (showVolume) {
      const volumeSeries = chart.addHistogramSeries({
        color: colors.volumeUp,
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: '',
        scaleMargins: {
          top: 0.7,
          bottom: 0,
        },
      });
      volumeSeriesRef.current = volumeSeries;
    }

    // Initialize indicator series
    indicatorSeriesRef.current = {};

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    // Add drawing event handlers
    const handleMouseDown = (param) => {
      if (!drawingMode) return;

      setIsDrawing(true);
      setDrawingStart({
        time: param.time,
        price: param.seriesPrices.values().next().value
      });
    };

    const handleMouseUp = (param) => {
      if (!isDrawing || !drawingStart || !drawingMode) return;

      const endPoint = {
        time: param.time,
        price: param.seriesPrices.values().next().value
      };

      if (drawingMode === 'trendline') {
        const newDrawing = {
          id: Date.now(),
          type: 'trendline',
          start: drawingStart,
          end: endPoint,
          color: getThemeColors().upColor
        };
        setDrawings(prev => [...prev, newDrawing]);
      } else if (drawingMode === 'fibonacci') {
        // Calculate Fibonacci levels
        const high = Math.max(drawingStart.price, endPoint.price);
        const low = Math.min(drawingStart.price, endPoint.price);
        const range = high - low;

        const fibLevels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
        const fibLines = fibLevels.map(level => ({
          price: high - (range * level),
          level: level,
          label: `${(level * 100).toFixed(1)}%`
        }));

        const newDrawing = {
          id: Date.now(),
          type: 'fibonacci',
          high,
          low,
          range,
          levels: fibLines,
          color: getThemeColors().rsi
        };
        setDrawings(prev => [...prev, newDrawing]);
      }

      setIsDrawing(false);
      setDrawingStart(null);
      setDrawingMode(null); // Reset drawing mode after drawing
    };

    // Subscribe to mouse events for drawing
    chart.subscribeClick((param) => {
      if (drawingMode === 'fibonacci') {
        handleMouseDown(param);
        // For Fibonacci, we need two clicks - start and end
        if (drawingStart) {
          handleMouseUp(param);
        }
      }
    });

    chart.subscribeCrosshairMove((param) => {
      if (drawingMode === 'trendline' && isDrawing && drawingStart) {
        // Update preview line while drawing
        // This would require custom overlay rendering
      }
    });

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, [height, showVolume, getThemeColors, drawingMode, isDrawing, drawingStart]);

  // Update chart data
  useEffect(() => {
    if (!chartRef.current || !candlestickSeriesRef.current) return;

    const sampleData = generateSampleData();
    setChartData(sampleData);

    const volumeData = sampleData.map(d => ({
      time: d.time,
      value: d.volume,
      color: d.close >= d.open ? getThemeColors().volumeUp : getThemeColors().volumeDown
    }));
    setVolumeData(volumeData);

    candlestickSeriesRef.current.setData(sampleData);
    if (volumeSeriesRef.current) {
      volumeSeriesRef.current.setData(volumeData);
    }
  }, [generateSampleData, getThemeColors]);

  // Update indicators
  useEffect(() => {
    if (!chartRef.current || chartData.length === 0) return;

    const newIndicatorData = calculateIndicators(chartData);
    setIndicatorData(newIndicatorData);

    const colors = getThemeColors();

    // Update RSI
    if (indicators.rsi.enabled && newIndicatorData.rsi) {
      if (!indicatorSeriesRef.current.rsi) {
        indicatorSeriesRef.current.rsi = chartRef.current.addLineSeries({
          color: colors.rsi,
          lineWidth: 1,
          title: 'RSI',
          priceScaleId: 'rsi',
          scaleMargins: {
            top: 0.1,
            bottom: 0.1,
          },
        });
      }

      const rsiData = newIndicatorData.rsi.map((value, index) => ({
        time: chartData[index]?.time,
        value: value
      })).filter(d => d.value !== null);

      indicatorSeriesRef.current.rsi.setData(rsiData);
    } else if (indicatorSeriesRef.current.rsi) {
      chartRef.current.removeSeries(indicatorSeriesRef.current.rsi);
      delete indicatorSeriesRef.current.rsi;
    }

    // Update MACD
    if (indicators.macd.enabled && newIndicatorData.macd) {
      if (!indicatorSeriesRef.current.macd) {
        indicatorSeriesRef.current.macd = chartRef.current.addLineSeries({
          color: colors.macd,
          lineWidth: 1,
          title: 'MACD',
          priceScaleId: 'macd',
        });
      }
      if (!indicatorSeriesRef.current.signal) {
        indicatorSeriesRef.current.signal = chartRef.current.addLineSeries({
          color: colors.signal,
          lineWidth: 1,
          title: 'Signal',
          priceScaleId: 'macd',
        });
      }
      if (!indicatorSeriesRef.current.histogram) {
        indicatorSeriesRef.current.histogram = chartRef.current.addHistogramSeries({
          color: colors.histogram,
          title: 'MACD Histogram',
          priceScaleId: 'macd',
        });
      }

      const macdData = newIndicatorData.macd.map((item, index) => ({
        time: chartData[index]?.time,
        value: item.macd
      })).filter(d => d.value !== null);

      const signalData = newIndicatorData.macd.map((item, index) => ({
        time: chartData[index]?.time,
        value: item.signal
      })).filter(d => d.value !== null);

      const histogramData = newIndicatorData.macd.map((item, index) => ({
        time: chartData[index]?.time,
        value: item.histogram
      })).filter(d => d.value !== null);

      indicatorSeriesRef.current.macd.setData(macdData);
      indicatorSeriesRef.current.signal.setData(signalData);
      indicatorSeriesRef.current.histogram.setData(histogramData);
    } else {
      ['macd', 'signal', 'histogram'].forEach(key => {
        if (indicatorSeriesRef.current[key]) {
          chartRef.current.removeSeries(indicatorSeriesRef.current[key]);
          delete indicatorSeriesRef.current[key];
        }
      });
    }

    // Update Bollinger Bands
    if (indicators.bollingerBands.enabled && newIndicatorData.bollingerBands) {
      if (!indicatorSeriesRef.current.bollingerUpper) {
        indicatorSeriesRef.current.bollingerUpper = chartRef.current.addLineSeries({
          color: colors.bollingerUpper,
          lineWidth: 1,
          title: 'BB Upper',
        });
      }
      if (!indicatorSeriesRef.current.bollingerLower) {
        indicatorSeriesRef.current.bollingerLower = chartRef.current.addLineSeries({
          color: colors.bollingerLower,
          lineWidth: 1,
          title: 'BB Lower',
        });
      }
      if (!indicatorSeriesRef.current.bollingerMiddle) {
        indicatorSeriesRef.current.bollingerMiddle = chartRef.current.addLineSeries({
          color: colors.bollingerMiddle,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          title: 'BB Middle',
        });
      }

      const upperData = newIndicatorData.bollingerBands.map((item, index) => ({
        time: chartData[index]?.time,
        value: item.upper
      })).filter(d => d.value !== null);

      const lowerData = newIndicatorData.bollingerBands.map((item, index) => ({
        time: chartData[index]?.time,
        value: item.lower
      })).filter(d => d.value !== null);

      const middleData = newIndicatorData.bollingerBands.map((item, index) => ({
        time: chartData[index]?.time,
        value: item.middle
      })).filter(d => d.value !== null);

      indicatorSeriesRef.current.bollingerUpper.setData(upperData);
      indicatorSeriesRef.current.bollingerLower.setData(lowerData);
      indicatorSeriesRef.current.bollingerMiddle.setData(middleData);
    } else {
      ['bollingerUpper', 'bollingerLower', 'bollingerMiddle'].forEach(key => {
        if (indicatorSeriesRef.current[key]) {
          chartRef.current.removeSeries(indicatorSeriesRef.current[key]);
          delete indicatorSeriesRef.current[key];
        }
      });
    }

    // Update Volatility
    if (indicators.volatility.enabled && newIndicatorData.volatility) {
      if (!indicatorSeriesRef.current.volatility) {
        indicatorSeriesRef.current.volatility = chartRef.current.addLineSeries({
          color: colors.volatility,
          lineWidth: 1,
          title: 'Historical Volatility',
          priceScaleId: 'volatility',
        });
      }

      const volatilityData = newIndicatorData.volatility.map((value, index) => ({
        time: chartData[index]?.time,
        value: value
      })).filter(d => d.value !== null);

      indicatorSeriesRef.current.volatility.setData(volatilityData);
    } else if (indicatorSeriesRef.current.volatility) {
      chartRef.current.removeSeries(indicatorSeriesRef.current.volatility);
      delete indicatorSeriesRef.current.volatility;
    }

    // Update Volume Profile
    if (indicators.volumeProfile.enabled && newIndicatorData.volumeProfile) {
      // Volume profile is displayed as a separate overlay
      // For now, we'll show it as histogram bars on the right side
      if (!indicatorSeriesRef.current.volumeProfile) {
        indicatorSeriesRef.current.volumeProfile = chartRef.current.addHistogramSeries({
          color: colors.volumeUp,
          title: 'Volume Profile',
          priceScaleId: 'volumeProfile',
          scaleMargins: {
            top: 0.1,
            bottom: 0.1,
          },
        });
      }

      // Convert volume profile data to histogram format
      const maxVolume = Math.max(...newIndicatorData.volumeProfile.map(v => v.volume));
      const volumeProfileData = newIndicatorData.volumeProfile.map(item => ({
        time: chartData[0]?.time, // Use first data point time as reference
        value: (item.volume / maxVolume) * 100, // Normalize to percentage
        color: item.volume > maxVolume * 0.7 ? colors.volumeUp : colors.volumeDown
      }));

      indicatorSeriesRef.current.volumeProfile.setData(volumeProfileData);
    } else if (indicatorSeriesRef.current.volumeProfile) {
      chartRef.current.removeSeries(indicatorSeriesRef.current.volumeProfile);
      delete indicatorSeriesRef.current.volumeProfile;
    }

  }, [chartData, indicators, calculateIndicators, getThemeColors]);

  // Render drawings on chart
  useEffect(() => {
    if (!chartRef.current || drawings.length === 0) return;

    // Clear existing drawing markers
    drawings.forEach(drawing => {
      if (drawing.markerId) {
        chartRef.current.removeMarker(drawing.markerId);
      }
    });

    // Add drawing markers/lines
    const markers = [];

    drawings.forEach(drawing => {
      if (drawing.type === 'trendline') {
        // For trend lines, we'll add markers at start and end points
        markers.push({
          time: drawing.start.time,
          position: 'inBar',
          color: drawing.color,
          shape: 'circle',
          text: 'Start'
        });
        markers.push({
          time: drawing.end.time,
          position: 'inBar',
          color: drawing.color,
          shape: 'circle',
          text: 'End'
        });
      } else if (drawing.type === 'fibonacci') {
        // For Fibonacci, add markers at each level
        drawing.levels.forEach(level => {
          markers.push({
            time: chartData[0]?.time, // Use first data point
            position: 'inBar',
            color: drawing.color,
            shape: 'circle',
            text: level.label,
            price: level.price
          });
        });
      }
    });

    // Apply markers to the main candlestick series
    if (candlestickSeriesRef.current && markers.length > 0) {
      candlestickSeriesRef.current.setMarkers(markers);
    }
  }, [drawings, chartData]);

  // Handle indicator toggle
  const toggleIndicator = (indicatorName) => {
    setIndicators(prev => ({
      ...prev,
      [indicatorName]: {
        ...prev[indicatorName],
        enabled: !prev[indicatorName].enabled
      }
    }));
  };

  // Handle parameter change
  const updateIndicatorParam = (indicatorName, param, value) => {
    setIndicators(prev => ({
      ...prev,
      [indicatorName]: {
        ...prev[indicatorName],
        [param]: value
      }
    }));
  };

  // Handle timeframe change
  const changeTimeframe = (newTimeframe) => {
    // In a real app, this would fetch new data
    console.log('Changing timeframe to:', newTimeframe);
  };

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Chart Controls */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Timeframe Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Timeframe:</span>
            <select
              value={timeframe}
              onChange={(e) => changeTimeframe(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              {timeframes.map(tf => (
                <option key={tf.value} value={tf.value}>{tf.label}</option>
              ))}
            </select>
          </div>

          {/* Drawing Tools */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tools:</span>
            <button
              onClick={() => setDrawingMode(drawingMode === 'trendline' ? null : 'trendline')}
              className={`px-3 py-1 text-sm rounded-md ${
                drawingMode === 'trendline'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
              }`}
            >
              Trend Line
            </button>
            <button
              onClick={() => setDrawingMode(drawingMode === 'fibonacci' ? null : 'fibonacci')}
              className={`px-3 py-1 text-sm rounded-md ${
                drawingMode === 'fibonacci'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
              }`}
            >
              Fibonacci
            </button>
            <button
              onClick={() => setDrawings([])}
              className="px-3 py-1 text-sm rounded-md bg-red-500 text-white hover:bg-red-600"
            >
              Clear Drawings
            </button>
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {isConnected ? 'Live' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Indicator Controls */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {/* RSI */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={indicators.rsi.enabled}
              onChange={() => toggleIndicator('rsi')}
              className="rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">RSI</span>
            {indicators.rsi.enabled && (
              <input
                type="number"
                value={indicators.rsi.period}
                onChange={(e) => updateIndicatorParam('rsi', 'period', parseInt(e.target.value))}
                className="w-12 px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                min="2"
                max="50"
              />
            )}
          </div>

          {/* MACD */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={indicators.macd.enabled}
              onChange={() => toggleIndicator('macd')}
              className="rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">MACD</span>
          </div>

          {/* Bollinger Bands */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={indicators.bollingerBands.enabled}
              onChange={() => toggleIndicator('bollingerBands')}
              className="rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">BB</span>
          </div>

          {/* Volume Profile */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={indicators.volumeProfile.enabled}
              onChange={() => toggleIndicator('volumeProfile')}
              className="rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Volume</span>
          </div>

          {/* Volatility */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={indicators.volatility.enabled}
              onChange={() => toggleIndicator('volatility')}
              className="rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">HV</span>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative">
        <div ref={chartContainerRef} className="w-full" style={{ height: `${height}px` }} />
        {drawingMode && (
          <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
            {drawingMode === 'trendline' ? 'Click and drag to draw trend line' : 'Click to set Fibonacci levels'}
          </div>
        )}
      </div>

      {/* Chart Info */}
      <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 text-center border-t border-gray-200 dark:border-gray-700">
        {symbol} • {timeframe} • {chartData.length} data points
        {Object.values(indicators).some(ind => ind.enabled) && (
          <span className="ml-2">
            • Indicators: {Object.entries(indicators).filter(([_, config]) => config.enabled).map(([key]) => key.toUpperCase()).join(', ')}
          </span>
        )}
      </div>
    </div>
  );
};

export default CryptoChart;