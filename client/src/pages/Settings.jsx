import { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '../lib/toast';

export default function Settings() {
  const { toastSuccess, toastError } = useToast();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      setConfig(data);
    } catch (err) {
      console.error('Failed to fetch config:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const updates = {};
      if (config) {
        updates.llm_provider = config.llm_provider || 'openai';
        updates.openai_base_url = config.openai_base_url || 'https://api.openai.com/v1';
        updates.openai_model = config.openai_model || 'gpt-4o-mini';
        updates.anthropic_model = config.anthropic_model || 'claude-sonnet-4-20250514';
        updates.ollama_base_url = config.ollama_base_url || 'http://localhost:11434';
        updates.ollama_model = config.ollama_model || 'llama3.1';
      }
      if (openaiKey) updates.openai_api_key = openaiKey;
      if (anthropicKey) updates.anthropic_api_key = anthropicKey;

      await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      setOpenaiKey('');
      setAnthropicKey('');
      toastSuccess('Configuration saved');
      await fetchConfig();
    } catch (err) {
      console.error('Failed to save:', err);
      toastError('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/config/test', { method: 'POST' });
      const data = await res.json();
      setTestResult(data);
      if (data.success) toastSuccess(`Connected to ${data.model?.model || 'provider'}`);
    } catch (err) {
      setTestResult({ success: false, error: err.message });
      toastError('Connection test failed');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-900 rounded w-48" />
      <div className="h-60 bg-gray-900 rounded-xl" />
    </div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Configuration</h1>
        <p className="text-gray-400 text-sm mt-1">Configure your LLM provider for threat analysis</p>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 space-y-6">
        {/* Provider Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">LLM Provider</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'openai', name: 'OpenAI', desc: 'GPT-4o, GPT-4o-mini, or compatible APIs' },
              { id: 'anthropic', name: 'Anthropic', desc: 'Claude Sonnet, Haiku, etc.' },
              { id: 'ollama', name: 'Ollama', desc: 'Free, local models' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setConfig({ ...config, llm_provider: p.id })}
                className={`p-3 rounded-lg border text-left transition ${
                  config?.llm_provider === p.id
                    ? 'border-red-500/50 bg-red-500/10'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }`}
              >
                <span className="text-white text-sm font-medium">{p.name}</span>
                <p className="text-gray-500 text-xs mt-0.5">{p.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* OpenAI Settings */}
        {config?.llm_provider === 'openai' && (
          <div className="space-y-3 border-t border-gray-800 pt-4">
            <h3 className="text-sm font-medium text-gray-300">OpenAI Configuration</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">API Key</label>
                <input
                  type="password"
                  value={openaiKey}
                  onChange={e => setOpenaiKey(e.target.value)}
                  placeholder={config.openai_api_key_masked || 'sk-...'}
                  className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 transition"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Base URL</label>
                <input
                  type="text"
                  value={config.openai_base_url || ''}
                  onChange={e => setConfig({ ...config, openai_base_url: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-red-500/50 transition"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Model</label>
              <input
                type="text"
                value={config.openai_model || ''}
                onChange={e => setConfig({ ...config, openai_model: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-red-500/50 transition"
              />
            </div>
          </div>
        )}

        {/* Anthropic Settings */}
        {config?.llm_provider === 'anthropic' && (
          <div className="space-y-3 border-t border-gray-800 pt-4">
            <h3 className="text-sm font-medium text-gray-300">Anthropic Configuration</h3>
            <div>
              <label className="block text-xs text-gray-400 mb-1">API Key</label>
              <input
                type="password"
                value={anthropicKey}
                onChange={e => setAnthropicKey(e.target.value)}
                placeholder={config.anthropic_api_key_masked || 'sk-ant-...'}
                className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 transition"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Model</label>
              <input
                type="text"
                value={config.anthropic_model || ''}
                onChange={e => setConfig({ ...config, anthropic_model: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-red-500/50 transition"
              />
            </div>
          </div>
        )}

        {/* Ollama Settings */}
        {config?.llm_provider === 'ollama' && (
          <div className="space-y-3 border-t border-gray-800 pt-4">
            <h3 className="text-sm font-medium text-gray-300">Ollama Configuration</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Base URL</label>
                <input
                  type="text"
                  value={config.ollama_base_url || ''}
                  onChange={e => setConfig({ ...config, ollama_base_url: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-red-500/50 transition"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Model</label>
                <input
                  type="text"
                  value={config.ollama_model || ''}
                  onChange={e => setConfig({ ...config, ollama_model: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-red-500/50 transition"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">Run <code className="bg-gray-800 px-1 rounded">ollama pull llama3.1</code> to download the model</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={saveConfig}
            disabled={saving}
            className="bg-red-600 hover:bg-red-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
          <button
            onClick={testConnection}
            disabled={testing}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm transition flex items-center gap-2 disabled:opacity-50"
          >
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            {testing ? 'Testing...' : 'Test Connection'}
          </button>

          {testResult && (
            <span className={`flex items-center gap-1 text-sm ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>
              {testResult.success ? <><CheckCircle className="w-4 h-4" /> Connected ({testResult.model?.model})</> : <><XCircle className="w-4 h-4" /> {testResult.error}</>}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
