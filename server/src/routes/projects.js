const crypto = require('crypto');
const { getAllProjects, findProject, createProject, updateProject, deleteProject } = require('../db/init');
const { validateProjectName, validateArchitecture } = require('../middleware/validate');

const router = require('express').Router();

// List all projects
router.get('/', (req, res) => {
  res.json(getAllProjects());
});

// Get single project
router.get('/:id', (req, res) => {
  const project = findProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json({
    ...project,
    architecture: typeof project.architecture === 'string' ? JSON.parse(project.architecture) : (project.architecture || {}),
    threats: typeof project.threats === 'string' ? JSON.parse(project.threats) : (project.threats || [])
  });
});

// Create project
router.post('/', (req, res) => {
  const { name, description = '', architecture = {} } = req.body;

  // Validate project name
  const nameError = validateProjectName(name);
  if (nameError) return res.status(400).json({ error: nameError });

  // Validate architecture if provided
  if (architecture && Object.keys(architecture).length > 0) {
    const errors = validateArchitecture(architecture);
    if (errors.length > 0) {
      return res.status(400).json({ error: errors[0], details: errors });
    }
  }

  const project = createProject({
    id: crypto.randomUUID(),
    name: name.trim(),
    description: typeof description === 'string' ? description.trim().slice(0, 5000) : '',
    architecture
  });

  res.status(201).json(project);
});

// Update project
router.put('/:id', (req, res) => {
  const existing = findProject(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Project not found' });

  const updates = {};
  if (req.body.name !== undefined) {
    const nameError = validateProjectName(req.body.name);
    if (nameError) return res.status(400).json({ error: nameError });
    updates.name = req.body.name.trim();
  }
  if (req.body.description !== undefined) {
    updates.description = typeof req.body.description === 'string'
      ? req.body.description.trim().slice(0, 5000)
      : '';
  }
  if (req.body.architecture !== undefined) {
    const errors = validateArchitecture(req.body.architecture);
    if (errors.length > 0) {
      return res.status(400).json({ error: errors[0], details: errors });
    }
    updates.architecture = req.body.architecture;
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'Nothing to update' });
  }

  const project = updateProject(req.params.id, updates);
  res.json(project);
});

// Delete project
router.delete('/:id', (req, res) => {
  const success = deleteProject(req.params.id);
  if (!success) return res.status(404).json({ error: 'Project not found' });
  res.json({ success: true });
});

module.exports = router;
