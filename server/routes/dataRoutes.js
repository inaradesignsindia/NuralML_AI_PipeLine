const express = require('express');
const router = express.Router();
const CoinGeckoClient = require('../apiClients/coinGeckoClient');
const NewsClient = require('../apiClients/newsClient');
const { apiLimiter } = require('../middleware/rateLimit');

const coinGecko = new CoinGeckoClient();
const newsClient = new NewsClient(process.env.NEWS_API_KEY || 'demo'); // Use demo or actual key

// Get historical data from CoinGecko
router.get('/historical/:coinId', apiLimiter, async (req, res) => {
  try {
    const { coinId } = req.params;
    const { days = 30 } = req.query;
    const data = await coinGecko.getHistoricalData(coinId, days);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get crypto news
router.get('/news', apiLimiter, async (req, res) => {
  try {
    const { query = 'cryptocurrency', pageSize = 10 } = req.query;
    const data = await newsClient.getCryptoNews(query, pageSize);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get coin list
router.get('/coins', apiLimiter, async (req, res) => {
  try {
    const data = await coinGecko.getCoinList();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;