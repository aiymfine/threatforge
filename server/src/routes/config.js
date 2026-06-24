const { getAllSettings, updateSettings, isExternalUrl, isLocalUrl } = require('../db/init');
const router = require('express').Router();

// Get current config (masked sensitive values)
router.get('/', (req, res) => {
  const config = getAllSettings();

  // Mask API keys
  if (config.openai_api_key && config.openai_api_key.length > 8) {
    config.openai_api_key_masked = config.openai_api_key.slice(0, 8) + '••••••••';
  } else {
    config.openai_api_key_masked = config.openai_api_key ? '••••••••' : '';
  }

  if (config.anthropic_api_key && config.anthropic_api_key.length > 8) {
    config.anthropic_api_key_masked = config.anthropic_api_key.slice(0, 8) + '••••••••';
  } else {
    config.anthropic_api_key_masked = config.anthropic_api_key ? '••••••••' : '';
  }

  // Don't expose actual keys
  delete config.openai_api_key;
  delete config.anthropic_api_key;

  res.json(config);
});

// Update config
router.put('/', (req, res) => {
  const allowedKeys = [
    'llm_provider', 'openai_api_key', 'openai_base_url', 'openai_model',
    'anthropic_api_key', 'anthropic_model', 'ollama_base_url', 'ollama_model'
  ];

  const updates = {};
  for (const [key, value] of Object.entries(req.body)) {
    if (!allowedKeys.includes(key)) continue;
    if (typeof value !== 'string') continue;

    // SSRF protection: validate URLs before saving
    if (key === 'openai_base_url' && value) {
      if (!isExternalUrl(value)) {
        return res.status(400).json({ error: 'OpenAI base URL must be a public HTTPS endpoint' });
      }
    }
    if (key === 'ollama_base_url' && value) {
      if (!isLocalUrl(value)) {
        return res.status(400).json({ error: 'Ollama base URL must be a local address (localhost/127.0.0.1)' });
      }
    }

    // Validate provider value
    if (key === 'llm_provider' && !['openai', 'anthropic', 'ollama'].includes(value)) {
      return res.status(400).json({ error: 'Invalid LLM provider. Must be: openai, anthropic, or ollama' });
    }

    updates[key] = value;
  }

  updateSettings(updates);
  res.json({ success: true });
});

// Test LLM connection
router.post('/test', async (req, res) => {
  const { getLLMClient } = require('../services/llm');
  try {
    const client = await getLLMClient();
    const response = await client.test();
    res.json({ success: true, model: response });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router;
