const { getAllProjects, findProject, createProject, updateProject, deleteProject } = require('../db/init');
const { v4: uuid } = require('uuid');

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

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Project name is required' });
  }

  const project = createProject({
    id: uuid(),
    name,
    description,
    architecture
  });

  res.status(201).json(project);
});

// Update project
router.put('/:id', (req, res) => {
  const existing = findProject(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Project not found' });

  const updates = {};
  if (req.body.name !== undefined) updates.name = req.body.name;
  if (req.body.description !== undefined) updates.description = req.body.description;
  if (req.body.architecture !== undefined) updates.architecture = req.body.architecture;

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
