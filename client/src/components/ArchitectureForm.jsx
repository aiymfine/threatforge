import { useState } from 'react';

export default function ArchitectureForm({ onSubmit, loading }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [components, setComponents] = useState([
    { name: '', type: 'Web Application', technology: '', auth: '', encryption: '', notes: '' }
  ]);
  const [flows, setFlows] = useState([
    { from: '', to: '', data: '', protocol: '', encryption: '', authentication: '' }
  ]);
  const [trustBoundaries, setTrustBoundaries] = useState([
    { name: '', components: '' }
  ]);
  const [externals, setExternals] = useState([]);
  const [context, setContext] = useState('');

  const addComponent = () => setComponents([...components, { name: '', type: 'Component', technology: '', auth: '', encryption: '', notes: '' }]);
  const removeComponent = (i) => setComponents(components.filter((_, idx) => idx !== i));
  const updateComponent = (i, field, value) => {
    const updated = [...components];
    updated[i] = { ...updated[i], [field]: value };
    setComponents(updated);
  };

  const addFlow = () => setFlows([...flows, { from: '', to: '', data: '', protocol: '', encryption: '', authentication: '' }]);
  const removeFlow = (i) => setFlows(flows.filter((_, idx) => idx !== i));
  const updateFlow = (i, field, value) => {
    const updated = [...flows];
    updated[i] = { ...updated[i], [field]: value };
    setFlows(updated);
  };

  const addBoundary = () => setTrustBoundaries([...trustBoundaries, { name: '', components: '' }]);
  const removeBoundary = (i) => setTrustBoundaries(trustBoundaries.filter((_, idx) => idx !== i));
  const updateBoundary = (i, field, value) => {
    const updated = [...trustBoundaries];
    updated[i] = { ...updated[i], [field]: value };
    setTrustBoundaries(updated);
  };

  const addExternal = () => setExternals([...externals, { name: '', type: 'API', notes: '' }]);
  const removeExternal = (i) => setExternals(externals.filter((_, idx) => idx !== i));
  const updateExternal = (i, field, value) => {
    const updated = [...externals];
    updated[i] = { ...updated[i], [field]: value };
    setExternals(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validComponents = components.filter(c => c.name.trim());
    const validFlows = flows.filter(f => f.from.trim() && f.to.trim());
    const validBoundaries = trustBoundaries.filter(b => b.name.trim()).map(b => ({
      ...b,
      components: b.components.split(',').map(c => c.trim()).filter(Boolean)
    }));
    const validExternals = externals.filter(e => e.name.trim());

    onSubmit({
      name: name.trim(),
      description: description.trim(),
      architecture: {
        components: validComponents,
        flows: validFlows,
        trustBoundaries: validBoundaries,
        externals: validExternals,
        context: context.trim()
      }
    });
  };

  const componentTypes = ['Web Application', 'API Server', 'Database', 'Message Queue', 'Cache', 'Load Balancer', 'CDN', 'Auth Service', 'Storage', 'Component', 'Mobile App', 'Desktop App', 'Service Mesh', 'Gateway', 'Other'];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Project Info */}
      <section className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
        <h2 className="text-lg font-semibold text-white">Project Info</h2>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Project Name *</label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g., E-Commerce Platform"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Brief description of your system and its purpose..."
            rows={2}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition resize-none"
          />
        </div>
      </section>

      {/* Components */}
      <section className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Components</h2>
          <button type="button" onClick={addComponent} className="text-sm text-red-400 hover:text-red-300 transition">+ Add Component</button>
        </div>
        <p className="text-sm text-gray-500">Define the building blocks of your system</p>
        <div className="space-y-3">
          {components.map((comp, i) => (
            <div key={i} className="bg-gray-800/50 rounded-lg border border-gray-700/50 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  required
                  value={comp.name}
                  onChange={e => updateComponent(i, 'name', e.target.value)}
                  placeholder="Component name *"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 transition"
                />
                <select
                  value={comp.type}
                  onChange={e => updateComponent(i, 'type', e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-red-500/50 transition"
                >
                  {componentTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {components.length > 1 && (
                  <button type="button" onClick={() => removeComponent(i)} className="text-gray-500 hover:text-red-400 transition p-1">✕</button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input type="text" value={comp.technology} onChange={e => updateComponent(i, 'technology', e.target.value)} placeholder="Technology (e.g., React, Node.js)" className="bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 transition" />
                <input type="text" value={comp.auth} onChange={e => updateComponent(i, 'auth', e.target.value)} placeholder="Auth method (e.g., JWT)" className="bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 transition" />
                <input type="text" value={comp.encryption} onChange={e => updateComponent(i, 'encryption', e.target.value)} placeholder="Encryption (e.g., TLS, AES-256)" className="bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 transition" />
              </div>
              <input type="text" value={comp.notes} onChange={e => updateComponent(i, 'notes', e.target.value)} placeholder="Additional notes..." className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 transition" />
            </div>
          ))}
        </div>
      </section>

      {/* Data Flows */}
      <section className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Data Flows</h2>
          <button type="button" onClick={addFlow} className="text-sm text-red-400 hover:text-red-300 transition">+ Add Flow</button>
        </div>
        <p className="text-sm text-gray-500">How data moves between components</p>
        <div className="space-y-3">
          {flows.map((flow, i) => (
            <div key={i} className="bg-gray-800/50 rounded-lg border border-gray-700/50 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <input type="text" value={flow.from} onChange={e => updateFlow(i, 'from', e.target.value)} placeholder="From *" className="flex-1 bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 transition" />
                <span className="text-gray-500">→</span>
                <input type="text" value={flow.to} onChange={e => updateFlow(i, 'to', e.target.value)} placeholder="To *" className="flex-1 bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 transition" />
                {flows.length > 1 && (
                  <button type="button" onClick={() => removeFlow(i)} className="text-gray-500 hover:text-red-400 transition p-1">✕</button>
                )}
              </div>
              <div className="grid grid-cols-4 gap-3">
                <input type="text" value={flow.data} onChange={e => updateFlow(i, 'data', e.target.value)} placeholder="Data type" className="bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 transition" />
                <input type="text" value={flow.protocol} onChange={e => updateFlow(i, 'protocol', e.target.value)} placeholder="Protocol (e.g., HTTPS)" className="bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 transition" />
                <input type="text" value={flow.encryption} onChange={e => updateFlow(i, 'encryption', e.target.value)} placeholder="Encryption" className="bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 transition" />
                <input type="text" value={flow.authentication} onChange={e => updateFlow(i, 'authentication', e.target.value)} placeholder="Authentication" className="bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 transition" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust Boundaries */}
      <section className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Trust Boundaries</h2>
          <button type="button" onClick={addBoundary} className="text-sm text-red-400 hover:text-red-300 transition">+ Add Boundary</button>
        </div>
        <p className="text-sm text-gray-500">Separate zones with different trust levels (optional)</p>
        <div className="space-y-3">
          {trustBoundaries.map((b, i) => (
            <div key={i} className="bg-gray-800/50 rounded-lg border border-gray-700/50 p-4">
              <div className="flex items-center gap-3">
                <input type="text" value={b.name} onChange={e => updateBoundary(i, 'name', e.target.value)} placeholder="Boundary name (e.g., DMZ, Internal Network)" className="flex-1 bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 transition" />
                <input type="text" value={b.components} onChange={e => updateBoundary(i, 'components', e.target.value)} placeholder="Components (comma-separated)" className="flex-1 bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 transition" />
                {trustBoundaries.length > 1 && (
                  <button type="button" onClick={() => removeBoundary(i)} className="text-gray-500 hover:text-red-400 transition p-1">✕</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* External Dependencies */}
      <section className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">External Dependencies</h2>
          <button type="button" onClick={addExternal} className="text-sm text-red-400 hover:text-red-300 transition">+ Add External</button>
        </div>
        <p className="text-sm text-gray-500">Third-party services your system depends on (optional)</p>
        <div className="space-y-3">
          {externals.length === 0 && <p className="text-sm text-gray-600 italic">No external dependencies added</p>}
          {externals.map((ext, i) => (
            <div key={i} className="bg-gray-800/50 rounded-lg border border-gray-700/50 p-4">
              <div className="flex items-center gap-3">
                <input type="text" value={ext.name} onChange={e => updateExternal(i, 'name', e.target.value)} placeholder="Service name" className="flex-1 bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 transition" />
                <input type="text" value={ext.type} onChange={e => updateExternal(i, 'type', e.target.value)} placeholder="Type (API, SDK, etc.)" className="bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 transition" />
                <input type="text" value={ext.notes} onChange={e => updateExternal(i, 'notes', e.target.value)} placeholder="Notes" className="flex-1 bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 transition" />
                <button type="button" onClick={() => removeExternal(i)} className="text-gray-500 hover:text-red-400 transition p-1">✕</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Additional Context */}
      <section className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
        <h2 className="text-lg font-semibold text-white">Additional Context</h2>
        <textarea
          value={context}
          onChange={e => setContext(e.target.value)}
          placeholder="Any additional information: compliance requirements, user roles, sensitive data types, deployment environment..."
          rows={3}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition resize-none"
        />
      </section>

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || !name.trim() || !components.some(c => c.name.trim())}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold px-6 py-2.5 rounded-lg transition text-sm"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              Analyzing...
            </>
          ) : (
            '🛡️ Analyze Threats'
          )}
        </button>
      </div>
    </form>
  );
}
