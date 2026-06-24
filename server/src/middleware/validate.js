const MAX_NAME_LENGTH = 200;
const MAX_DESC_LENGTH = 5000;
const MAX_COMPONENTS = 50;
const MAX_FLOWS = 100;
const MAX_FIELD_LENGTH = 1000;

function validateArchitecture(architecture) {
  const errors = [];

  if (!architecture || typeof architecture !== 'object') {
    return ['Architecture must be an object'];
  }

  if (!Array.isArray(architecture.components)) {
    return ['Architecture must have a components array'];
  }

  if (architecture.components.length === 0) {
    return ['At least one component is required'];
  }

  if (architecture.components.length > MAX_COMPONENTS) {
    errors.push(`Too many components (max ${MAX_COMPONENTS})`);
  }

  for (let i = 0; i < architecture.components.length; i++) {
    const comp = architecture.components[i];
    if (!comp.name || typeof comp.name !== 'string' || !comp.name.trim()) {
      errors.push(`Component ${i + 1} must have a name`);
    } else if (comp.name.length > MAX_NAME_LENGTH) {
      errors.push(`Component ${i + 1} name too long (max ${MAX_NAME_LENGTH} chars)`);
    }

    // Validate optional fields aren't excessively long
    for (const field of ['technology', 'auth', 'encryption', 'notes', 'type', 'network']) {
      if (comp[field] && typeof comp[field] === 'string' && comp[field].length > MAX_FIELD_LENGTH) {
        errors.push(`Component ${i + 1}.${field} too long (max ${MAX_FIELD_LENGTH} chars)`);
      }
    }
  }

  // Validate flows if present
  if (architecture.flows) {
    if (!Array.isArray(architecture.flows)) {
      errors.push('Flows must be an array');
    } else {
      if (architecture.flows.length > MAX_FLOWS) {
        errors.push(`Too many data flows (max ${MAX_FLOWS})`);
      }
      for (let i = 0; i < architecture.flows.length; i++) {
        const flow = architecture.flows[i];
        if (!flow.from || !flow.to) {
          errors.push(`Flow ${i + 1} must have both 'from' and 'to' fields`);
        }
      }
    }
  }

  return errors;
}

function validateProjectName(name) {
  if (!name || typeof name !== 'string' || !name.trim()) {
    return 'Project name is required';
  }
  if (name.length > MAX_NAME_LENGTH) {
    return `Project name too long (max ${MAX_NAME_LENGTH} chars)`;
  }
  return null;
}

module.exports = { validateArchitecture, validateProjectName };
