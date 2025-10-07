const express = require('express');
const router = express.Router();
const { strictLimiter } = require('../middleware/rateLimit');
const { verifyToken } = require('../passport');
const { getUserApiKeys, setUserApiKey, deleteUserApiKey, findUserByGithubId } = require('../database');

// Get user account data (protected)
router.get('/account', strictLimiter, verifyToken, async (req, res) => {
  try {
    const user = await findUserByGithubId(req.user.githubId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Mock trading data - in a real app, this would come from trading history
    const accountData = {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar_url: user.avatar_url,
      balance: 10000, // Mock balance
      positions: [], // Mock positions
      orders: [], // Mock orders
      created_at: user.created_at
    };
    res.json(accountData);
  } catch (error) {
    console.error('Error fetching account:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user account data (protected)
router.post('/account/update', strictLimiter, verifyToken, async (req, res) => {
  try {
    // Placeholder for updating user data
    // In a real app, you'd update the database
    res.json({ message: 'User data updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user data' });
  }
});

// Get user's API keys (protected)
router.get('/api-keys', strictLimiter, verifyToken, async (req, res) => {
  try {
    const apiKeys = await getUserApiKeys(req.user.userId);
    // Return masked keys for security (only show first/last few characters)
    const maskedKeys = apiKeys.map(key => ({
      exchange: key.exchange,
      api_key: maskApiKey(key.api_key),
      secret_key: maskApiKey(key.secret_key),
      status: 'configured' // In real app, you'd test connectivity
    }));
    res.json(maskedKeys);
  } catch (error) {
    console.error('Error fetching API keys:', error);
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
});

// Set/update API key for an exchange (protected)
router.post('/api-keys', strictLimiter, verifyToken, async (req, res) => {
  try {
    const { exchange, apiKey, secretKey } = req.body;

    if (!exchange || !apiKey || !secretKey) {
      return res.status(400).json({ error: 'Exchange, API key, and secret key are required' });
    }

    if (!['binance', 'delta'].includes(exchange.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid exchange. Supported: binance, delta' });
    }

    await setUserApiKey(req.user.userId, exchange.toLowerCase(), apiKey, secretKey);
    res.json({ message: `${exchange} API keys saved successfully` });
  } catch (error) {
    console.error('Error saving API keys:', error);
    res.status(500).json({ error: 'Failed to save API keys' });
  }
});

// Delete API key for an exchange (protected)
router.delete('/api-keys/:exchange', strictLimiter, verifyToken, async (req, res) => {
  try {
    const { exchange } = req.params;

    if (!['binance', 'delta'].includes(exchange.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid exchange' });
    }

    const result = await deleteUserApiKey(req.user.userId, exchange.toLowerCase());
    if (result.changes > 0) {
      res.json({ message: `${exchange} API keys deleted successfully` });
    } else {
      res.status(404).json({ error: 'API keys not found' });
    }
  } catch (error) {
    console.error('Error deleting API keys:', error);
    res.status(500).json({ error: 'Failed to delete API keys' });
  }
});

// Test API key connectivity (protected)
router.post('/api-keys/test', strictLimiter, verifyToken, async (req, res) => {
  try {
    const { exchange } = req.body;

    if (!exchange) {
      return res.status(400).json({ error: 'Exchange is required' });
    }

    // Get the user's API keys
    const apiKeys = await getUserApiKeys(req.user.userId);
    const keyData = apiKeys.find(key => key.exchange === exchange.toLowerCase());

    if (!keyData) {
      return res.status(404).json({ error: 'API keys not found for this exchange' });
    }

    // Test connectivity based on exchange
    let isValid = false;
    try {
      if (exchange.toLowerCase() === 'binance') {
        // Test Binance API
        const Binance = require('binance-api-node').default;
        const client = Binance({
          apiKey: keyData.api_key,
          apiSecret: keyData.secret_key
        });
        await client.accountInfo();
        isValid = true;
      } else if (exchange.toLowerCase() === 'delta') {
        // Test Delta Exchange API
        const axios = require('axios');
        const response = await axios.get('https://api.delta.exchange/v2/assets', {
          headers: {
            'api-key': keyData.api_key,
            'api-secret': keyData.secret_key
          }
        });
        isValid = response.status === 200;
      }
    } catch (error) {
      console.error(`API test failed for ${exchange}:`, error.message);
      isValid = false;
    }

    res.json({
      exchange,
      valid: isValid,
      message: isValid ? 'API keys are valid' : 'API keys are invalid or connection failed'
    });
  } catch (error) {
    console.error('Error testing API keys:', error);
    res.status(500).json({ error: 'Failed to test API keys' });
  }
});

// Helper function to mask API keys
function maskApiKey(key) {
  if (!key || key.length < 8) return '****';
  return key.substring(0, 4) + '****' + key.substring(key.length - 4);
}

module.exports = router;