const NodeCache = require('node-cache');

class SimulationEngine {
  constructor(options = {}) {
    this.initialBalance = options.initialBalance || 10000;
    this.feeRate = options.feeRate || 0.001; // 0.1% fee
    this.maxDrawdown = options.maxDrawdown || 0.1; // 10% max drawdown
    this.cache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache

    // Initialize virtual portfolio
    this.portfolio = {
      balance: this.initialBalance,
      positions: new Map(), // symbol -> position data
      tradeHistory: [],
      performance: {
        totalPnL: 0,
        winRate: 0,
        totalTrades: 0,
        winningTrades: 0,
        maxDrawdown: 0,
        sharpeRatio: 0,
        returns: []
      },
      isActive: false
    };

    this.marketData = new Map(); // symbol -> current price data
  }

  /**
   * Start simulation mode
   */
  startSimulation() {
    this.portfolio.isActive = true;
    this.portfolio.startTime = new Date();
    console.log('Simulation Engine: Started with balance $' + this.initialBalance);
    return {
      success: true,
      initialBalance: this.initialBalance,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Stop simulation mode
   */
  stopSimulation() {
    this.portfolio.isActive = false;
    this.portfolio.endTime = new Date();
    this.calculatePerformanceMetrics();
    console.log('Simulation Engine: Stopped');
    return {
      success: true,
      finalBalance: this.portfolio.balance,
      totalPnL: this.portfolio.performance.totalPnL,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Reset simulation to initial state
   */
  resetSimulation() {
    this.portfolio = {
      balance: this.initialBalance,
      positions: new Map(),
      tradeHistory: [],
      performance: {
        totalPnL: 0,
        winRate: 0,
        totalTrades: 0,
        winningTrades: 0,
        maxDrawdown: 0,
        sharpeRatio: 0,
        returns: []
      },
      isActive: false
    };
    this.marketData.clear();
    this.cache.flushAll();
    console.log('Simulation Engine: Reset to initial state');
    return { success: true, initialBalance: this.initialBalance };
  }

  /**
   * Update market data for simulation
   * @param {string} symbol - Trading symbol
   * @param {Object} data - Market data (price, volume, etc.)
   */
  updateMarketData(symbol, data) {
    this.marketData.set(symbol, {
      ...data,
      timestamp: Date.now()
    });

    // Update position P&L if we have positions
    this.updatePositionPnL(symbol);
  }

  /**
   * Execute a simulated trade
   * @param {Object} trade - Trade object from AI chain
   */
  executeTrade(trade) {
    if (!this.portfolio.isActive) {
      throw new Error('Simulation not active');
    }

    const {
      trade_type,
      strike_price,
      quantity,
      hedge_action,
      hedge_quantity,
      exchange_selection,
      slippage_tolerance
    } = trade;

    // Calculate trade cost
    const tradeValue = strike_price * quantity;
    const fees = tradeValue * this.feeRate;
    const totalCost = tradeValue + fees;

    // Check if we have enough balance
    if (totalCost > this.portfolio.balance) {
      throw new Error('Insufficient balance for trade');
    }

    // Check max drawdown
    const currentDrawdown = (this.initialBalance - this.portfolio.balance) / this.initialBalance;
    if (currentDrawdown > this.maxDrawdown) {
      throw new Error('Maximum drawdown exceeded');
    }

    // Create position
    const positionKey = `${trade_type}_${strike_price}`;
    const existingPosition = this.portfolio.positions.get(positionKey);

    const position = {
      symbol: positionKey,
      type: trade_type,
      strikePrice: strike_price,
      quantity: existingPosition ? existingPosition.quantity + quantity : quantity,
      entryPrice: strike_price,
      entryTime: new Date(),
      fees: fees,
      exchange: exchange_selection,
      hedgeAction: hedge_action,
      hedgeQuantity: hedge_quantity,
      currentPnL: 0,
      unrealizedPnL: 0
    };

    this.portfolio.positions.set(positionKey, position);
    this.portfolio.balance -= totalCost;

    // Record trade
    const tradeRecord = {
      id: Date.now().toString(),
      timestamp: new Date(),
      type: 'ENTRY',
      symbol: positionKey,
      tradeType: trade_type,
      quantity: quantity,
      price: strike_price,
      fees: fees,
      balance: this.portfolio.balance
    };

    this.portfolio.tradeHistory.push(tradeRecord);
    this.portfolio.performance.totalTrades++;

    console.log(`Simulation Engine: Executed ${trade_type} trade for ${quantity} contracts at $${strike_price}`);

    return {
      success: true,
      tradeId: tradeRecord.id,
      position: position,
      newBalance: this.portfolio.balance
    };
  }

  /**
   * Close a position
   * @param {string} positionKey - Position identifier
   * @param {number} exitPrice - Exit price
   */
  closePosition(positionKey, exitPrice) {
    const position = this.portfolio.positions.get(positionKey);
    if (!position) {
      throw new Error('Position not found');
    }

    const exitValue = exitPrice * Math.abs(position.quantity);
    const fees = exitValue * this.feeRate;
    const netExitValue = exitPrice * position.quantity; // Positive for profit, negative for loss

    // Calculate P&L
    const entryValue = position.entryPrice * position.quantity;
    const grossPnL = netExitValue - entryValue;
    const netPnL = grossPnL - position.fees - fees;

    // Update balance
    this.portfolio.balance += exitValue - fees;
    this.portfolio.performance.totalPnL += netPnL;

    // Track winning trades
    if (netPnL > 0) {
      this.portfolio.performance.winningTrades++;
    }

    // Record exit trade
    const tradeRecord = {
      id: Date.now().toString(),
      timestamp: new Date(),
      type: 'EXIT',
      symbol: positionKey,
      quantity: position.quantity,
      entryPrice: position.entryPrice,
      exitPrice: exitPrice,
      grossPnL: grossPnL,
      netPnL: netPnL,
      fees: fees,
      balance: this.portfolio.balance
    };

    this.portfolio.tradeHistory.push(tradeRecord);

    // Remove position
    this.portfolio.positions.delete(positionKey);

    console.log(`Simulation Engine: Closed position ${positionKey} with P&L: $${netPnL.toFixed(2)}`);

    return {
      success: true,
      tradeId: tradeRecord.id,
      netPnL: netPnL,
      newBalance: this.portfolio.balance
    };
  }

  /**
   * Update P&L for open positions based on current market data
   * @param {string} symbol - Symbol to update
   */
  updatePositionPnL(symbol) {
    const marketData = this.marketData.get(symbol);
    if (!marketData) return;

    const position = this.portfolio.positions.get(symbol);
    if (!position) return;

    const currentPrice = marketData.price;
    const entryValue = position.entryPrice * position.quantity;
    const currentValue = currentPrice * position.quantity;
    position.unrealizedPnL = currentValue - entryValue - position.fees;
    position.currentPrice = currentPrice;
  }

  /**
   * Get current portfolio status
   */
  getPortfolioStatus() {
    const positions = Array.from(this.portfolio.positions.values());
    const totalUnrealizedPnL = positions.reduce((sum, pos) => sum + (pos.unrealizedPnL || 0), 0);

    return {
      isActive: this.portfolio.isActive,
      balance: this.portfolio.balance,
      totalValue: this.portfolio.balance + totalUnrealizedPnL,
      totalPnL: this.portfolio.performance.totalPnL + totalUnrealizedPnL,
      positions: positions,
      tradeCount: this.portfolio.tradeHistory.length,
      performance: this.portfolio.performance,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Calculate performance metrics
   */
  calculatePerformanceMetrics() {
    const trades = this.portfolio.tradeHistory.filter(t => t.type === 'EXIT');

    if (trades.length === 0) return;

    // Win rate
    this.portfolio.performance.winRate = this.portfolio.performance.winningTrades / trades.length;

    // Max drawdown
    let peak = this.initialBalance;
    let maxDrawdown = 0;
    let currentBalance = this.initialBalance;

    for (const trade of this.portfolio.tradeHistory) {
      currentBalance = trade.balance;
      if (currentBalance > peak) {
        peak = currentBalance;
      }
      const drawdown = (peak - currentBalance) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    this.portfolio.performance.maxDrawdown = maxDrawdown;

    // Sharpe ratio (simplified - using daily returns)
    const returns = trades.map(t => t.netPnL / this.initialBalance);
    if (returns.length > 1) {
      const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
      const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
      const stdDev = Math.sqrt(variance);
      this.portfolio.performance.sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;
    }

    this.portfolio.performance.returns = returns;
  }

  /**
   * Get trade history
   * @param {number} limit - Maximum number of trades to return
   */
  getTradeHistory(limit = 50) {
    return this.portfolio.tradeHistory.slice(-limit);
  }

  /**
   * Get performance report
   */
  getPerformanceReport() {
    this.calculatePerformanceMetrics();

    const status = this.getPortfolioStatus();
    const trades = this.portfolio.tradeHistory.filter(t => t.type === 'EXIT');

    return {
      summary: {
        initialBalance: this.initialBalance,
        finalBalance: status.totalValue,
        totalReturn: (status.totalValue - this.initialBalance) / this.initialBalance,
        totalPnL: status.totalPnL,
        winRate: this.portfolio.performance.winRate,
        totalTrades: trades.length,
        winningTrades: this.portfolio.performance.winningTrades,
        losingTrades: trades.length - this.portfolio.performance.winningTrades
      },
      riskMetrics: {
        maxDrawdown: this.portfolio.performance.maxDrawdown,
        sharpeRatio: this.portfolio.performance.sharpeRatio
      },
      positions: status.positions,
      recentTrades: this.getTradeHistory(10),
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = SimulationEngine;