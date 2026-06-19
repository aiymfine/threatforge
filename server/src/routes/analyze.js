const { findProject, updateProject } = require('../db/init');
const { generateThreatModel } = require('../services/threatEngine');
const router = require('express').Router();

// One-off analysis (no project save)
router.post('/', async (req, res) => {
  const { architecture, description = '', provider, model } = req.body;

  if (!architecture || !architecture.components || architecture.components.length === 0) {
    return res.status(400).json({ error: 'Architecture with at least one component is required' });
  }

  try {
    const startTime = Date.now();
    const threats = await generateThreatModel(architecture, description, { provider, model });
    const elapsed = Date.now() - startTime;

    const stats = {
      total: threats.length,
      critical: threats.filter(t => t.severity >= 15).length,
      high: threats.filter(t => t.severity >= 10 && t.severity < 15).length,
      medium: threats.filter(t => t.severity >= 5 && t.severity < 10).length,
      low: threats.filter(t => t.severity < 5).length,
      byCategory: {
        Spoofing: threats.filter(t => t.category === 'Spoofing').length,
        Tampering: threats.filter(t => t.category === 'Tampering').length,
        Repudiation: threats.filter(t => t.category === 'Repudiation').length,
        'Information Disclosure': threats.filter(t => t.category === 'Information Disclosure').length,
        'Denial of Service': threats.filter(t => t.category === 'Denial of Service').length,
        'Elevation of Privilege': threats.filter(t => t.category === 'Elevation of Privilege').length
      }
    };

    res.json({ threats, stats, analysisTimeMs: elapsed });
  } catch (err) {
    console.error('Analysis failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// Analyze and save to project
router.post('/project/:id', async (req, res) => {
  const project = findProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const architecture = typeof project.architecture === 'string' ? JSON.parse(project.architecture) : (project.architecture || {});

  if (!architecture.components || architecture.components.length === 0) {
    return res.status(400).json({ error: 'Architecture has no components defined' });
  }

  try {
    const startTime = Date.now();
    const threats = await generateThreatModel(architecture, project.description, {});
    const elapsed = Date.now() - startTime;

    const updated = updateProject(req.params.id, {
      threats,
      status: 'analyzed',
      analysis_time_ms: elapsed
    });

    res.json({ ...updated, analysisTimeMs: elapsed });
  } catch (err) {
    console.error('Analysis failed:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
