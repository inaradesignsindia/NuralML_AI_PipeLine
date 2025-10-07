const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const jwt = require('jsonwebtoken');
const { findUserByGithubId, createUser } = require('./database');

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "http://localhost:3001/auth/github/callback"
  },
  async function(accessToken, refreshToken, profile, done) {
    try {
      // Check if user exists
      let user = await findUserByGithubId(profile.id);

      if (!user) {
        // Create new user
        user = await createUser({
          github_id: profile.id,
          username: profile.username || profile.displayName,
          email: profile.emails ? profile.emails[0].value : null,
          avatar_url: profile.photos ? profile.photos[0].value : null
        });
      }

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    // For JWT, we don't need to deserialize from session
    // This is mainly for session-based auth
    done(null, { id });
  } catch (error) {
    done(error, null);
  }
});

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      githubId: user.github_id,
      username: user.username
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Verify JWT token middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = {
  passport,
  generateToken,
  verifyToken
};