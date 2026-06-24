export function generateHTMLReport(project) {
  if (!project) return '';

  const threats = project.threats || [];
  const stats = {
    total: threats.length,
    critical: threats.filter(t => t.severity >= 15).length,
    high: threats.filter(t => t.severity >= 10 && t.severity < 15).length,
    medium: threats.filter(t => t.severity >= 5 && t.severity < 10).length,
    low: threats.filter(t => t.severity < 5).length,
    byCategory: {
      'Spoofing': threats.filter(t => t.category === 'Spoofing').length,
      'Tampering': threats.filter(t => t.category === 'Tampering').length,
      'Repudiation': threats.filter(t => t.category === 'Repudiation').length,
      'Information Disclosure': threats.filter(t => t.category === 'Information Disclosure').length,
      'Denial of Service': threats.filter(t => t.category === 'Denial of Service').length,
      'Elevation of Privilege': threats.filter(t => t.category === 'Elevation of Privilege').length
    }
  };

  const severityColor = (s) => {
    if (s >= 15) return '#ef4444';
    if (s >= 10) return '#f97316';
    if (s >= 5) return '#eab308';
    return '#22c55e';
  };

  const severityLabel = (s) => {
    if (s >= 15) return 'CRITICAL';
    if (s >= 10) return 'HIGH';
    if (s >= 5) return 'MEDIUM';
    return 'LOW';
  };

  const escape = (str) => String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Threat Model — ${escape(project.name)}</title>
<style>
  @page { margin: 2cm; size: A4; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a2e; line-height: 1.6; padding: 2rem; max-width: 900px; margin: 0 auto; background: #fff; }
  .header { border-bottom: 3px solid #dc2626; padding-bottom: 1.5rem; margin-bottom: 2rem; }
  .header h1 { font-size: 1.8rem; color: #1a1a2e; margin-bottom: 0.25rem; }
  .header .subtitle { color: #6b7280; font-size: 0.95rem; }
  .header .meta { color: #9ca3af; font-size: 0.85rem; margin-top: 0.5rem; }

  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem; }
  .stat { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1rem; text-align: center; }
  .stat .value { font-size: 1.8rem; font-weight: 700; }
  .stat .label { font-size: 0.8rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
  .stat.critical .value { color: #ef4444; }
  .stat.high .value { color: #f97316; }
  .stat.medium .value { color: #eab308; }
  .stat.low .value { color: #22c55e; }

  .section { margin-bottom: 2rem; }
  .section h2 { font-size: 1.2rem; color: #1a1a2e; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid #e5e7eb; }

  table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
  th, td { padding: 0.5rem 0.75rem; text-align: left; border-bottom: 1px solid #f3f4f6; }
  th { font-weight: 600; color: #374151; background: #f9fafb; }
  tr:hover { background: #f9fafb; }

  .threat { border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 1rem; page-break-inside: avoid; }
  .threat-header { padding: 1rem 1.25rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.75rem; }
  .threat-id { font-family: monospace; font-size: 0.8rem; color: #9ca3af; }
  .severity-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; color: #fff; }
  .category-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 500; background: #f3f4f6; color: #374151; }
  .threat-title { font-weight: 600; font-size: 0.95rem; flex: 1; }
  .threat-body { padding: 1rem 1.25rem; }
  .threat-body h4 { font-size: 0.8rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin: 0.75rem 0 0.25rem; }
  .threat-body h4:first-child { margin-top: 0; }
  .threat-body p { font-size: 0.9rem; color: #374151; margin-bottom: 0.5rem; }
  .threat-body .mitigation { background: #f0fdf4; border-left: 3px solid #22c55e; padding: 0.75rem; margin-top: 0.5rem; border-radius: 0 4px 4px 0; }
  .threat-body .mitigation p { color: #166534; }
  .threat-body .examples li { font-size: 0.85rem; color: #6b7280; margin-left: 1rem; margin-bottom: 0.25rem; }

  .category-table { margin-bottom: 1rem; }
  .footer { text-align: center; color: #9ca3af; font-size: 0.8rem; margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; }

  @media print { body { padding: 0; } }
</style>
</head>
<body>

<div class="header">
  <h1>🛡️ ${escape(project.name)}</h1>
  <div class="subtitle">STRIDE Threat Model Report</div>
  <div class="meta">Generated: ${date} | Threats: ${stats.total} | Analysis time: ${project.analysis_time_ms ? (project.analysis_time_ms / 1000).toFixed(1) + 's' : 'N/A'}</div>
</div>

${project.description ? `<p style="color: #6b7280; margin-bottom: 2rem;">${escape(project.description)}</p>` : ''}

<div class="stats">
  <div class="stat critical"><div class="value">${stats.critical}</div><div class="label">Critical</div></div>
  <div class="stat high"><div class="value">${stats.high}</div><div class="label">High</div></div>
  <div class="stat medium"><div class="value">${stats.medium}</div><div class="label">Medium</div></div>
  <div class="stat low"><div class="value">${stats.low}</div><div class="label">Low</div></div>
</div>

<div class="section">
  <h2>Threats by STRIDE Category</h2>
  <table class="category-table">
    <thead><tr><th>Category</th><th>Count</th><th>Percentage</th></tr></thead>
    <tbody>
    ${Object.entries(stats.byCategory).map(([cat, count]) => `
      <tr><td>${escape(cat)}</td><td>${count}</td><td>${stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) : 0}%</td></tr>
    `).join('')}
    </tbody>
  </table>
</div>

<div class="section">
  <h2>Threat Details</h2>
  ${threats.map(t => `
    <div class="threat">
      <div class="threat-header">
        <span class="threat-id">${escape(t.id)}</span>
        <span class="severity-badge" style="background: ${severityColor(t.severity)}">${severityLabel(t.severity)} (${t.severity})</span>
        <span class="category-badge">${escape(t.category)}</span>
        <span class="threat-title">${escape(t.title)}</span>
      </div>
      <div class="threat-body">
        <h4>Description</h4>
        <p>${escape(t.description)}</p>

        <h4>Target</h4>
        <p>${escape(t.target) || '—'}</p>

        <h4>Scoring</h4>
        <p>Likelihood: ${t.likelihood}/5 × Impact: ${t.impact}/5 = <strong>${t.severity}</strong></p>

        ${t.cwe || t.owasp ? `
          <h4>References</h4>
          <p>${[t.cwe, t.owasp].filter(Boolean).map(r => escape(r)).join(' · ')}</p>
        ` : ''}

        ${t.mitigation ? `
          <h4>Mitigation</h4>
          <div class="mitigation"><p>${escape(t.mitigation)}</p></div>
        ` : ''}

        ${t.examples?.length > 0 ? `
          <h4>Attack Scenarios</h4>
          <ul class="examples">${t.examples.map(ex => `<li>${escape(ex)}</li>`).join('')}</ul>
        ` : ''}
      </div>
    </div>
  `).join('')}
</div>

<div class="footer">
  Generated by <strong>ThreatForge</strong> — AI-Powered Threat Modeling<br>
  <a href="https://github.com/aiymfine/threatforge">github.com/aiymfine/threatforge</a>
</div>

</body>
</html>`;
}
