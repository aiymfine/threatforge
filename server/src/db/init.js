const fs = require('fs');
const path = require('path');
const { encrypt, decrypt } = require('../services/crypto');

const DATA_DIR = process.env.DATA_DIR || './data';
const DB_PATH = path.join(DATA_DIR, 'threatforge.json');
const SETTINGS_PATH = path.join(DATA_DIR, 'settings.json');

// Fields that should be encrypted at rest
const ENCRYPTED_FIELDS = ['openai_api_key', 'anthropic_api_key'];

// Allowed base URL hosts for LLM providers (blocks SSRF to internal networks)
const ALLOWED_LOCALHOST_HOSTS = ['localhost', '127.0.0.1', '::1'];
const PRIVATE_IP_PATTERN = /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|169\.254)/;

let projects = [];
let settings = {};

function initDb() {
  const fullPath = path.resolve(DATA_DIR);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }

  // Load projects
  if (fs.existsSync(DB_PATH)) {
    try {
      projects = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
      if (!Array.isArray(projects)) projects = [];
    } catch {
      projects = [];
    }
  }

  // Load settings
  if (fs.existsSync(SETTINGS_PATH)) {
    try {
      settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8'));
      if (typeof settings !== 'object' || settings === null) settings = {};
    } catch {
      settings = {};
    }
  }

  // Seed default settings if empty
  if (Object.keys(settings).length === 0) {
    settings = {
      llm_provider: 'openai',
      openai_api_key: '',
      openai_base_url: 'https://api.openai.com/v1',
      openai_model: 'gpt-4o-mini',
      anthropic_api_key: '',
      anthropic_model: 'claude-sonnet-4-20250514',
      ollama_base_url: 'http://localhost:11434',
      ollama_model: 'llama3.1'
    };
    saveSettings();
  }

  // Migrate: encrypt plaintext keys if not yet encrypted
  if (!settings._keys_encrypted) {
    for (const key of ENCRYPTED_FIELDS) {
      if (settings[key] && typeof settings[key] === 'string' && settings[key].length > 0) {
        // Only encrypt if it doesn't look like a base64 ciphertext
        try {
          const decoded = Buffer.from(settings[key], 'base64');
          // If it's valid base64 and long enough, it might already be encrypted
          if (decoded.length > 24) continue;
        } catch {
          // Not valid base64 — this is plaintext, encrypt it
        }
        settings[key] = encrypt(settings[key]);
      }
    }
    settings._keys_encrypted = true;
    saveSettings();
  }
}

// Atomic write: write to temp file then rename to prevent corruption on crash
function atomicWrite(filePath, data) {
  const dir = path.resolve(DATA_DIR);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const tmpPath = filePath + '.tmp';
  fs.writeFileSync(tmpPath, data);
  fs.renameSync(tmpPath, filePath);
}

function saveProjects() {
  atomicWrite(DB_PATH, JSON.stringify(projects, null, 2));
}

function saveSettings() {
  atomicWrite(SETTINGS_PATH, JSON.stringify(settings, null, 2));
}

// Project helpers
function findProject(id) {
  if (!id || typeof id !== 'string') return null;
  return projects.find(p => p.id === id) || null;
}

function getAllProjects() {
  return projects
    .map(p => ({
      ...p,
      threat_count: (p.threats || []).length
    }))
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
}

function createProject(data) {
  const now = new Date().toISOString().replace('T', ' ').split('.')[0];
  const project = {
    id: data.id,
    name: data.name,
    description: data.description || '',
    architecture: data.architecture || {},
    threats: [],
    status: 'draft',
    provider: '',
    model: '',
    analysis_time_ms: 0,
    created_at: now,
    updated_at: now
  };
  projects.push(project);
  saveProjects();
  return project;
}

function updateProject(id, updates) {
  const idx = projects.findIndex(p => p.id === id);
  if (idx === -1) return null;
  projects[idx] = {
    ...projects[idx],
    ...updates,
    updated_at: new Date().toISOString().replace('T', ' ').split('.')[0]
  };
  saveProjects();
  return projects[idx];
}

function deleteProject(id) {
  const idx = projects.findIndex(p => p.id === id);
  if (idx === -1) return false;
  projects.splice(idx, 1);
  saveProjects();
  return true;
}

// Settings helpers — transparently encrypt/decrypt sensitive fields
function getSetting(key) {
  const raw = settings[key] ?? null;
  if (raw && ENCRYPTED_FIELDS.includes(key)) {
    return decrypt(raw);
  }
  return raw;
}

function setSetting(key, value) {
  if (value && ENCRYPTED_FIELDS.includes(key)) {
    settings[key] = encrypt(value);
  } else {
    settings[key] = value;
  }
  saveSettings();
}

function getAllSettings() {
  const result = { ...settings };
  // Decrypt sensitive fields for the caller
  for (const key of ENCRYPTED_FIELDS) {
    if (result[key]) {
      result[key] = decrypt(result[key]);
    }
  }
  // Remove internal metadata
  delete result._keys_encrypted;
  return result;
}

function updateSettings(updates) {
  for (const [key, value] of Object.entries(updates)) {
    if (value && ENCRYPTED_FIELDS.includes(key)) {
      settings[key] = encrypt(value);
    } else {
      settings[key] = value;
    }
  }
  saveSettings();
}

// URL validation (SSRF protection)
function isExternalUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    const host = parsed.hostname;
    if (ALLOWED_LOCALHOST_HOSTS.includes(host)) return false;
    if (PRIVATE_IP_PATTERN.test(host)) return false;
    return true;
  } catch {
    return false;
  }
}

function isLocalUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:') return false;
    return ALLOWED_LOCALHOST_HOSTS.includes(parsed.hostname);
  } catch {
    return false;
  }
}

module.exports = {
  initDb, findProject, getAllProjects, createProject, updateProject, deleteProject,
  getSetting, setSetting, getAllSettings, updateSettings,
  isExternalUrl, isLocalUrl
};
