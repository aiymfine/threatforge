import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Download, ChevronDown, ChevronUp, AlertTriangle, Shield, Search } from 'lucide-react';
import { SeverityBadge, CategoryBadge } from '../components/Badges';

const strideCategories = ['Spoofing', 'Tampering', 'Repudiation', 'Information Disclosure', 'Denial of Service', 'Elevation of Privilege'];

export default function ProjectView() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [expandedThreat, setExpandedThreat] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (!res.ok) throw new Error('Project not found');
      const data = await res.json();
      setProject(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reAnalyze = async () => {
    setAnalyzing(true);
    setError('');
    try {
      const res = await fetch(`/api/analyze/project/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Analysis failed');
      }
      const data = await res.json();
      setProject(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const stats = useMemo(() => {
    if (!project?.threats?.length) return null;
    const threats = project.threats;
    return {
      total: threats.length,
      critical: threats.filter(t => t.severity >= 15).length,
      high: threats.filter(t => t.severity >= 10 && t.severity < 15).length,
      medium: threats.filter(t => t.severity >= 5 && t.severity < 10).length,
      low: threats.filter(t => t.severity < 5).length,
      byCategory: Object.fromEntries(strideCategories.map(c => [c, threats.filter(t => t.category === c).length]))
    };
  }, [project]);

  const filteredThreats = useMemo(() => {
    if (!project?.threats) return [];
    return project.threats.filter(t => {
      if (filterCategory !== 'all' && t.category !== filterCategory) return false;
      if (filterSeverity !== 'all') {
        const s = t.severity;
        if (filterSeverity === 'critical' && s < 15) return false;
        if (filterSeverity === 'high' && (s < 10 || s >= 15)) return false;
        if (filterSeverity === 'medium' && (s < 5 || s >= 10)) return false;
        if (filterSeverity === 'low' && s >= 5) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!t.title.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q) && !t.target.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [project, filterCategory, filterSeverity, searchQuery]);

  const exportJSON = () => {
    if (!project) return;
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, '-').toLowerCase()}-threat-model.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-900 rounded w-64 mb-4" />
          <div className="h-4 bg-gray-900 rounded w-96 mb-8" />
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-900 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-gray-400 mb-4">{error}</p>
        <Link to="/" className="text-red-400 hover:text-red-300 text-sm">← Back to projects</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link to="/" className="text-gray-500 hover:text-gray-300 text-sm flex items-center gap-1 mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Projects
          </Link>
          <h1 className="text-2xl font-bold text-white">{project.name}</h1>
          {project.description && <p className="text-gray-400 text-sm mt-1">{project.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportJSON} className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg text-sm transition">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button onClick={reAnalyze} disabled={analyzing} className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 disabled:opacity-50 px-3 py-1.5 rounded-lg text-sm transition">
            <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} /> Re-analyze
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">{error}</div>
      )}

      {/* Stats */}
      {stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Critical" value={stats.critical} color="text-red-400" bg="bg-red-500/10 border-red-500/20" />
            <StatCard label="High" value={stats.high} color="text-orange-400" bg="bg-orange-500/10 border-orange-500/20" />
            <StatCard label="Medium" value={stats.medium} color="text-yellow-400" bg="bg-yellow-500/10 border-yellow-500/20" />
            <StatCard label="Low" value={stats.low} color="text-green-400" bg="bg-green-500/10 border-green-500/20" />
          </div>

          {/* Category breakdown */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Threats by Category</h3>
            <div className="flex flex-wrap gap-2">
              {strideCategories.map(cat => {
                const count = stats.byCategory[cat];
                const pct = stats.total > 0 ? (count / stats.total * 100) : 0;
                return (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(filterCategory === cat ? 'all' : cat)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border transition ${
                      filterCategory === cat ? 'border-red-500/50 bg-red-500/10' : 'border-gray-700/50 bg-gray-800/50 hover:bg-gray-800'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full" style={{
                      backgroundColor: {
                        'Spoofing': '#a855f7',
                        'Tampering': '#3b82f6',
                        'Repudiation': '#06b6d4',
                        'Information Disclosure': '#eab308',
                        'Denial of Service': '#f97316',
                        'Elevation of Privilege': '#ef4444'
                      }[cat]
                    }} />
                    <span className="text-gray-300 text-xs">{cat}</span>
                    <span className="text-gray-500 text-xs">{count}</span>
                    <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{
                        width: `${pct}%`,
                        backgroundColor: {
                          'Spoofing': '#a855f7',
                          'Tampering': '#3b82f6',
                          'Repudiation': '#06b6d4',
                          'Information Disclosure': '#eab308',
                          'Denial of Service': '#f97316',
                          'Elevation of Privilege': '#ef4444'
                        }[cat]
                      }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Filters */}
      {project.threats?.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search threats..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 transition"
            />
          </div>
          <select
            value={filterSeverity}
            onChange={e => setFilterSeverity(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-red-500/50 transition"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical (15+)</option>
            <option value="high">High (10-14)</option>
            <option value="medium">Medium (5-9)</option>
            <option value="low">Low (1-4)</option>
          </select>
          <span className="text-gray-500 text-sm">{filteredThreats.length} of {project.threats.length} threats</span>
        </div>
      )}

      {/* Threat List */}
      {!project.threats || project.threats.length === 0 ? (
        <div className="bg-gray-900 rounded-xl border border-gray-800 border-dashed p-12 text-center">
          <Shield className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No threats analyzed yet</p>
          <p className="text-gray-500 text-sm mt-1">Click "Re-analyze" to generate threat model</p>
        </div>
      ) : filteredThreats.length === 0 ? (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center">
          <p className="text-gray-500">No threats match your filters</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredThreats.map((threat) => (
            <div key={threat.id} className="bg-gray-900 rounded-xl border border-gray-800 hover:border-gray-700 transition overflow-hidden">
              <button
                onClick={() => setExpandedThreat(expandedThreat === threat.id ? null : threat.id)}
                className="w-full px-4 py-3 flex items-center gap-4 text-left"
              >
                <span className="text-gray-500 text-xs font-mono w-12 shrink-0">{threat.id}</span>
                <SeverityBadge score={threat.severity} />
                <CategoryBadge category={threat.category} />
                <span className="flex-1 text-white text-sm font-medium truncate">{threat.title}</span>
                <span className="text-gray-500 text-xs shrink-0">{threat.target}</span>
                {expandedThreat === threat.id ? <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />}
              </button>

              {expandedThreat === threat.id && (
                <div className="border-t border-gray-800 px-4 py-4 space-y-4">
                  {/* Description */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Description</h4>
                    <p className="text-gray-300 text-sm leading-relaxed">{threat.description}</p>
                  </div>

                  {/* Target & Scores */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Target</h4>
                      <p className="text-gray-300 text-sm">{threat.target || '—'}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Likelihood × Impact</h4>
                      <p className="text-gray-300 text-sm">{threat.likelihood}/5 × {threat.impact}/5 = <span className="text-white font-semibold">{threat.severity}</span></p>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">References</h4>
                      <div className="flex flex-wrap gap-2">
                        {threat.cwe && <span className="text-xs bg-gray-800 px-2 py-0.5 rounded text-gray-400">{threat.cwe}</span>}
                        {threat.owasp && <span className="text-xs bg-gray-800 px-2 py-0.5 rounded text-gray-400">{threat.owasp}</span>}
                        {!threat.cwe && !threat.owasp && <span className="text-gray-500 text-sm">—</span>}
                      </div>
                    </div>
                  </div>

                  {/* Mitigation */}
                  {threat.mitigation && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Mitigation</h4>
                      <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
                        <p className="text-green-300/90 text-sm leading-relaxed">{threat.mitigation}</p>
                      </div>
                    </div>
                  )}

                  {/* Examples */}
                  {threat.examples?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Attack Scenarios</h4>
                      <ul className="space-y-1">
                        {threat.examples.map((ex, i) => (
                          <li key={i} className="text-gray-400 text-sm flex items-start gap-2">
                            <span className="text-orange-400 mt-1">▸</span> {ex}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color, bg }) {
  return (
    <div className={`${bg} border rounded-xl p-4`}>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-gray-400 text-xs mt-0.5">{label}</p>
    </div>
  );
}
