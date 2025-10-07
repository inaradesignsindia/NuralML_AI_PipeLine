const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
db.serialize(() => {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      github_id TEXT UNIQUE NOT NULL,
      username TEXT NOT NULL,
      email TEXT,
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // API Keys table (encrypted storage)
  db.run(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      exchange TEXT NOT NULL,
      api_key TEXT NOT NULL,
      secret_key TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      UNIQUE(user_id, exchange)
    )
  `);

  // Sessions table for JWT blacklisting (optional, for logout)
  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);
});

// Helper functions
const findUserByGithubId = (githubId) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE github_id = ?', [githubId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const createUser = (userData) => {
  return new Promise((resolve, reject) => {
    const { github_id, username, email, avatar_url } = userData;
    db.run(
      'INSERT INTO users (github_id, username, email, avatar_url) VALUES (?, ?, ?, ?)',
      [github_id, username, email, avatar_url],
      function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, ...userData });
      }
    );
  });
};

const getUserApiKeys = (userId) => {
  return new Promise((resolve, reject) => {
    db.all('SELECT exchange, api_key, secret_key FROM api_keys WHERE user_id = ?', [userId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const setUserApiKey = (userId, exchange, apiKey, secretKey) => {
  return new Promise((resolve, reject) => {
    // Encrypt the keys before storing
    const encryptedApiKey = encryptData(apiKey);
    const encryptedSecretKey = encryptData(secretKey);

    db.run(
      `INSERT OR REPLACE INTO api_keys (user_id, exchange, api_key, secret_key, updated_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [userId, exchange, encryptedApiKey, encryptedSecretKey],
      function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      }
    );
  });
};

const deleteUserApiKey = (userId, exchange) => {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM api_keys WHERE user_id = ? AND exchange = ?', [userId, exchange], function(err) {
      if (err) reject(err);
      else resolve({ changes: this.changes });
    });
  });
};

// Simple encryption/decryption using bcrypt (for demo; use proper encryption in production)
const encryptData = (data) => {
  // In production, use proper encryption like AES
  // For now, we'll store as-is but hash for comparison
  return data; // TODO: Implement proper encryption
};

const decryptData = (encryptedData) => {
  return encryptedData; // TODO: Implement proper decryption
};

const addSession = (userId, tokenHash, expiresAt) => {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [userId, tokenHash, expiresAt],
      function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      }
    );
  });
};

const removeSession = (tokenHash) => {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM sessions WHERE token_hash = ?', [tokenHash], function(err) {
      if (err) reject(err);
      else resolve({ changes: this.changes });
    });
  });
};

const isSessionValid = (tokenHash) => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM sessions WHERE token_hash = ? AND expires_at > CURRENT_TIMESTAMP',
      [tokenHash],
      (err, row) => {
        if (err) reject(err);
        else resolve(!!row);
      }
    );
  });
};

module.exports = {
  db,
  findUserByGithubId,
  createUser,
  getUserApiKeys,
  setUserApiKey,
  deleteUserApiKey,
  encryptData,
  decryptData,
  addSession,
  removeSession,
  isSessionValid
};