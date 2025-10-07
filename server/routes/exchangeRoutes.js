const express = require('express');
const router = express.Router();
const BinanceClient = require('../apiClients/binanceClient');
const DeltaClient = require('../apiClients/deltaClient');
const { apiLimiter } = require('../middleware/rateLimit');

const binance = new BinanceClient(process.env.BINANCE_API_KEY, process.env.BINANCE_SECRET_KEY);
const delta = new DeltaClient(process.env.DELTA_API_KEY, process.env.DELTA_SECRET_KEY);

// Binance routes
router.get('/binance/ticker/:symbol', apiLimiter, async (req, res) => {
  try {
    const { symbol } = req.params;
    const data = await binance.getTickerPrice(symbol);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/binance/historical/:symbol', apiLimiter, async (req, res) => {
  try {
    const { symbol } = req.params;
    const { interval = '1d', limit = 100 } = req.query;
    const data = await binance.getHistoricalData(symbol, interval, limit);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delta routes
router.get('/delta/ticker/:symbol', apiLimiter, async (req, res) => {
  try {
    const { symbol } = req.params;
    const data = await delta.getTickerPrice(symbol);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/delta/historical/:symbol', apiLimiter, async (req, res) => {
  try {
    const { symbol } = req.params;
    const { resolution = '1D', limit = 100 } = req.query;
    const data = await delta.getHistoricalData(symbol, resolution, limit);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;