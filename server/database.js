const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const path = require('path');
const bcrypt = require('bcryptjs');

// Initialize lowdb with default data
const defaultData = {
  users: [],
  apiKeys: [],
  sessions: []
};

const dbPath = process.env.DATABASE_URL || path.join(__dirname, 'database.json');
const adapter = new JSONFile(dbPath);
const db = new Low(adapter, defaultData);

// Helper functions
const findUserByGithubId = async (githubId) => {
  await db.read();
  const user = db.data.users.find(u => u.github_id === githubId);
  return user;
};

const createUser = async (userData) => {
  await db.read();
  const { github_id, username, email, avatar_url } = userData;
  const newUser = {
    id: Date.now(), // Simple ID generation
    github_id,
    username,
    email,
    avatar_url,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  db.data.users.push(newUser);
  await db.write();
  return newUser;
};

const getUserApiKeys = async (userId) => {
  await db.read();
  return db.data.apiKeys.filter(key => key.user_id === userId);
};

const setUserApiKey = async (userId, exchange, apiKey, secretKey) => {
  await db.read();
  // Encrypt the keys before storing
  const encryptedApiKey = encryptData(apiKey);
  const encryptedSecretKey = encryptData(secretKey);

  const existingIndex = db.data.apiKeys.findIndex(key => key.user_id === userId && key.exchange === exchange);
  const apiKeyEntry = {
    id: Date.now(),
    user_id: userId,
    exchange,
    api_key: encryptedApiKey,
    secret_key: encryptedSecretKey,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (existingIndex >= 0) {
    db.data.apiKeys[existingIndex] = apiKeyEntry;
  } else {
    db.data.apiKeys.push(apiKeyEntry);
  }

  await db.write();
  return { id: apiKeyEntry.id };
};

const deleteUserApiKey = async (userId, exchange) => {
  await db.read();
  const initialLength = db.data.apiKeys.length;
  db.data.apiKeys = db.data.apiKeys.filter(key => !(key.user_id === userId && key.exchange === exchange));
  const changes = initialLength - db.data.apiKeys.length;
  await db.write();
  return { changes };
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

const addSession = async (userId, tokenHash, expiresAt) => {
  await db.read();
  const session = {
    id: Date.now(),
    user_id: userId,
    token_hash: tokenHash,
    expires_at: expiresAt,
    created_at: new Date().toISOString()
  };
  db.data.sessions.push(session);
  await db.write();
  return { id: session.id };
};

const removeSession = async (tokenHash) => {
  await db.read();
  const initialLength = db.data.sessions.length;
  db.data.sessions = db.data.sessions.filter(s => s.token_hash !== tokenHash);
  const changes = initialLength - db.data.sessions.length;
  await db.write();
  return { changes };
};

const isSessionValid = async (tokenHash) => {
  await db.read();
  const session = db.data.sessions.find(s => s.token_hash === tokenHash && new Date(s.expires_at) > new Date());
  return !!session;
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