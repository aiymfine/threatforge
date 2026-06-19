import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ArchitectureForm from '../components/ArchitectureForm';

export default function NewProject() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async ({ name, description, architecture }) => {
    setLoading(true);
    setError('');

    try {
      // Create project first
      const projectRes = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, architecture })
      });

      if (!projectRes.ok) {
        const err = await projectRes.json();
        throw new Error(err.error || 'Failed to create project');
      }

      const project = await projectRes.json();

      // Run analysis
      const analyzeRes = await fetch(`/api/analyze/project/${project.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      if (!analyzeRes.ok) {
        const err = await analyzeRes.json();
        throw new Error(err.error || 'Analysis failed');
      }

      navigate(`/project/${project.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">New Threat Model</h1>
        <p className="text-gray-400 text-sm mt-1">Describe your system architecture to identify potential threats</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      <ArchitectureForm onSubmit={handleSubmit} loading={loading} />
    </div>
  );
}
