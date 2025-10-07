const express = require('express');
const { passport, generateToken, verifyToken } = require('../passport');
const { findUserByGithubId } = require('../database');

const router = express.Router();

// Initiate GitHub OAuth
router.get('/github',
  passport.authenticate('github', { scope: ['user:email'] })
);

// GitHub OAuth callback
router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: '/login' }),
  (req, res) => {
    // Generate JWT token
    const token = generateToken(req.user);

    // Redirect to frontend with token
    // In production, you might want to set this as a cookie or use a different approach
    res.redirect(`http://localhost:3000/auth/callback?token=${token}`);
  }
);

// Get current user info
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await findUserByGithubId(req.user.githubId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return user info without sensitive data
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      avatar_url: user.avatar_url,
      created_at: user.created_at
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout (client-side token removal is sufficient for JWT)
router.post('/logout', verifyToken, (req, res) => {
  // In a more advanced setup, you could blacklist the token
  res.json({ message: 'Logged out successfully' });
});

// Refresh token (optional)
router.post('/refresh', verifyToken, (req, res) => {
  try {
    const newToken = generateToken(req.user);
    res.json({ token: newToken });
  } catch (error) {
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

module.exports = router;