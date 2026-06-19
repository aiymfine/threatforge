import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Clock, CheckCircle2, AlertTriangle, Trash2 } from 'lucide-react';

export default function Home() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(data => setProjects(Array.isArray(data) ? data : []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  const deleteProject = async (id) => {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    setProjects(projects.filter(p => p.id !== id));
  };

  const statusIcon = (status) => {
    switch (status) {
      case 'analyzed': return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-900 to-red-950/30 border border-gray-800 p-8">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-white mb-2">AI-Powered Threat Modeling</h1>
          <p className="text-gray-400 max-w-2xl mb-6">
            Describe your system architecture and let ThreatForge identify vulnerabilities using the STRIDE methodology. 
            Get actionable security recommendations before attackers find them.
          </p>
          <Link
            to="/new"
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-semibold px-5 py-2.5 rounded-lg transition text-sm"
          >
            <Plus className="w-4 h-4" />
            New Analysis
          </Link>
        </div>
        {/* Decorative grid */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Projects */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Projects</h2>
        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-900 rounded-xl border border-gray-800 h-20" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-gray-900 rounded-xl border border-gray-800 border-dashed p-12 text-center">
            <AlertTriangle className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 mb-1">No projects yet</p>
            <p className="text-gray-500 text-sm mb-4">Create your first threat model to get started</p>
            <Link to="/new" className="inline-flex items-center gap-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 px-4 py-2 rounded-lg transition text-sm">
              <Plus className="w-4 h-4" />New Project
            </Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {projects.map(project => (
              <Link key={project.id} to={`/project/${project.id}`} className="block bg-gray-900 rounded-xl border border-gray-800 hover:border-gray-700 transition p-4 group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {statusIcon(project.status)}
                    <div>
                      <h3 className="text-white font-medium group-hover:text-red-400 transition">{project.name}</h3>
                      {project.description && <p className="text-gray-500 text-sm mt-0.5">{project.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    {project.threat_count > 0 && (
                      <span className="text-gray-400">{project.threat_count} threats</span>
                    )}
                    {project.analysis_time_ms > 0 && (
                      <span className="text-gray-500">{(project.analysis_time_ms / 1000).toFixed(1)}s</span>
                    )}
                    <span className="text-gray-600">{new Date(project.updated_at).toLocaleDateString()}</span>
                    <button
                      onClick={e => { e.preventDefault(); deleteProject(project.id); }}
                      className="text-gray-600 hover:text-red-400 transition p-1 opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
