import { useState, useEffect } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import { AUTH_EVENT } from '../lib/authFetch';

export default function LoginModal() {
  const [visible, setVisible] = useState(false);
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const show = () => setVisible(true);
    document.addEventListener(AUTH_EVENT, show);

    // Check if a 401 happened before this component mounted
    // by testing the stored key against a protected endpoint
    const savedKey = localStorage.getItem('tf_api_key');
    if (!savedKey) {
      // Try a protected request to see if auth is required
      fetch('/api/projects', { headers: { 'Accept': 'application/json' } })
        .then(res => {
          if (res.status === 401) setVisible(true);
        })
        .catch(() => {});
    }

    return () => document.removeEventListener(AUTH_EVENT, show);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/config', {
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        localStorage.setItem('tf_api_key', key);
        setVisible(false);
        setKey('');
        window.location.reload();
      } else if (res.status === 403) {
        setError('Invalid API key');
      } else if (res.status === 401) {
        setError('Server requires authentication — enter the TF_ADMIN_KEY');
      } else {
        setError('Authentication failed');
      }
    } catch {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 p-6 w-full max-w-sm mx-4">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h2 className="text-white font-semibold">Authentication Required</h2>
            <p className="text-gray-400 text-sm">Enter the admin API key to continue</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            value={key}
            onChange={e => setKey(e.target.value)}
            placeholder="TF_ADMIN_KEY"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition"
            autoFocus
            autoComplete="current-password"
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={loading || !key.trim()}
            className="w-full bg-red-600 hover:bg-red-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium px-4 py-2.5 rounded-lg text-sm transition flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? 'Verifying...' : 'Authenticate'}
          </button>
        </form>
      </div>
    </div>
  );
}
