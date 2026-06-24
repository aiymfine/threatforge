const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || './data';
const DB_PATH = path.join(DATA_DIR, 'threatforge.json');
const SETTINGS_PATH = path.join(DATA_DIR, 'settings.json');

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
}

// Note: writeFileSync is synchronous and Node.js is single-threaded for JS execution,
// so concurrent writes to the same file won't interleave. A write queue is not needed
// for the current sync implementation. If migrated to async writes, add a mutex.
function saveProjects() {
  const fullPath = path.resolve(DATA_DIR);
  if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(projects, null, 2));
}

function saveSettings() {
  const fullPath = path.resolve(DATA_DIR);
  if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
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

// Settings helpers
function getSetting(key) {
  return settings[key] ?? null;
}

function setSetting(key, value) {
  settings[key] = value;
  saveSettings();
}

function getAllSettings() {
  return { ...settings };
}

function updateSettings(updates) {
  for (const [key, value] of Object.entries(updates)) {
    settings[key] = value;
  }
  saveSettings();
}

// URL validation (SSRF protection)
function isExternalUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    const host = parsed.hostname;
    // Block private IPs, localhost, and link-local addresses
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
