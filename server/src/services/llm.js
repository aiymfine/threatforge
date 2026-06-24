const { getSetting, isExternalUrl, isLocalUrl } = require('../db/init');

async function getLLMClient() {
  const provider = getSetting('llm_provider') || 'openai';

  if (provider === 'ollama') return createOllamaClient();
  if (provider === 'anthropic') return createAnthropicClient();
  return createOpenAIClient();
}

// ── OpenAI (and compatible) ──────────────────────────────
function createOpenAIClient() {
  const apiKey = getSetting('openai_api_key');
  let baseUrl = getSetting('openai_base_url') || 'https://api.openai.com/v1';
  const model = getSetting('openai_model') || 'gpt-4o-mini';

  if (!apiKey) throw new Error('OpenAI API key not configured');

  // SSRF protection: validate base URL points to a public endpoint
  if (!isExternalUrl(baseUrl)) {
    throw new Error('OpenAI base URL must be a public HTTPS endpoint (no internal/localhost addresses)');
  }

  // Normalize trailing slash
  if (!baseUrl.endsWith('/')) baseUrl += '/';

  const OpenAI = require('openai');
  const client = new OpenAI({ apiKey, baseURL: baseUrl });

  return {
    provider: 'openai',
    model,
    async chat(systemPrompt, userMessage) {
      const response = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });
      return response.choices[0].message.content;
    },
    async test() {
      const response = await client.chat.completions.create({
        model,
        messages: [{ role: 'user', content: 'Respond with only: OK' }],
        max_tokens: 5
      });
      return { provider: 'openai', model };
    }
  };
}

// ── Anthropic ─────────────────────────────────────────────
function createAnthropicClient() {
  const apiKey = getSetting('anthropic_api_key');
  const model = getSetting('anthropic_model') || 'claude-sonnet-4-20250514';

  if (!apiKey) throw new Error('Anthropic API key not configured');

  // Anthropic URL is hardcoded to the public API — no SSRF risk

  return {
    provider: 'anthropic',
    model,
    async chat(systemPrompt, userMessage) {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model,
          max_tokens: 8192,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }]
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(`Anthropic API error: ${err.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data.content[0].text;
    },
    async test() {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model,
          max_tokens: 5,
          messages: [{ role: 'user', content: 'Respond with only: OK' }]
        })
      });
      if (!response.ok) throw new Error(`Anthropic test failed: ${response.statusText}`);
      return { provider: 'anthropic', model };
    }
  };
}

// ── Ollama (local, free) ────────────────────────────────
function createOllamaClient() {
  const baseUrl = getSetting('ollama_base_url') || 'http://localhost:11434';
  const model = getSetting('ollama_model') || 'llama3.1';

  // SSRF protection: Ollama must be on localhost only
  if (!isLocalUrl(baseUrl)) {
    throw new Error('Ollama base URL must be a local address (localhost/127.0.0.1)');
  }

  return {
    provider: 'ollama',
    model,
    async chat(systemPrompt, userMessage) {
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          stream: false,
          format: 'json'
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama error: ${response.statusText}. Is Ollama running?`);
      }

      const data = await response.json();
      return data.message.content;
    },
    async test() {
      const response = await fetch(`${baseUrl}/api/tags`);
      if (!response.ok) throw new Error(`Ollama not reachable at ${baseUrl}`);
      return { provider: 'ollama', model };
    }
  };
}

module.exports = { getLLMClient };
