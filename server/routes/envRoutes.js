const express = require('express');
const router = express.Router();

// Get environment variables (safe ones only)
router.get('/', (req, res) => {
  try {
    // Only return safe environment variables
    const safeEnvVars = {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      FRONTEND_URL: process.env.FRONTEND_URL,
      DAPP_INTERVAL: process.env.DAPP_INTERVAL,
      // Add other safe vars as needed
    };

    res.json(safeEnvVars);
  } catch (error) {
    console.error('Error fetching environment variables:', error);
    res.status(500).json({ error: 'Failed to fetch environment variables' });
  }
});

// Update environment variable (for demo purposes, in real app this would be admin only)
router.put('/:key', (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    // In a real application, this would require authentication and validation
    // For demo purposes, allow updating certain vars
    const allowedKeys = ['DAPP_INTERVAL', 'PORT'];

    if (!allowedKeys.includes(key)) {
      return res.status(403).json({ error: 'Cannot modify this environment variable' });
    }

    // Note: This won't persist across restarts, just for demo
    process.env[key] = value;

    res.json({ message: `Environment variable ${key} updated`, value });
  } catch (error) {
    console.error('Error updating environment variable:', error);
    res.status(500).json({ error: 'Failed to update environment variable' });
  }
});

module.exports = router;