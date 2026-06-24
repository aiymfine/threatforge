import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Clock, CheckCircle2, AlertTriangle, Trash2, Search, ArrowUpDown } from 'lucide-react';
import { useToast } from '../lib/toast';

export default function Home() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('updated');
  const { toastSuccess, toastError } = useToast();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (id, name) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setProjects(prev => prev.filter(p => p.id !== id));
      toastSuccess('Project deleted');
    } catch {
      toastError('Failed to delete project');
    }
  };

  const filteredAndSorted = useMemo(() => {
    let result = projects;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      );
    }

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'threats':
          return (b.threat_count || 0) - (a.threat_count || 0);
        case 'updated':
        default:
          return new Date(b.updated_at) - new Date(a.updated_at);
      }
    });

    return result;
  }, [projects, searchQuery, sortBy]);

  const statusIcon = (status) => {
    switch (status) {
      case 'analyzed': return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const sortOptions = [
    { value: 'updated', label: 'Last Updated' },
    { value: 'name', label: 'Name' },
    { value: 'threats', label: 'Threat Count' }
  ];

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
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Projects</h2>
          {projects.length > 0 && (
            <span className="text-gray-500 text-sm">{filteredAndSorted.length} of {projects.length} projects</span>
          )}
        </div>

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
        ) : filteredAndSorted.length === 0 ? (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center">
            <p className="text-gray-500">No projects match "{searchQuery}"</p>
          </div>
        ) : (
          <>
            {/* Search + Sort Bar */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search projects..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 transition"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-gray-500" />
                {sortOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSortBy(opt.value)}
                    className={`px-2.5 py-1 rounded-md text-xs transition ${
                      sortBy === opt.value
                        ? 'bg-gray-800 text-white border border-gray-700'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3">
              {filteredAndSorted.map(project => (
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
                        onClick={e => { e.preventDefault(); e.stopPropagation(); deleteProject(project.id, project.name); }}
                        className="text-gray-600 hover:text-red-400 transition p-1 opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
