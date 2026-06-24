import { describe, it, expect } from 'vitest';

const MAX_NAME_LENGTH = 200;
const MAX_COMPONENTS = 50;

function validateProjectName(name) {
  if (!name || typeof name !== 'string' || !name.trim()) {
    return 'Project name is required';
  }
  if (name.length > MAX_NAME_LENGTH) {
    return `Project name too long (max ${MAX_NAME_LENGTH} chars)`;
  }
  return null;
}

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
    }
  }
  if (architecture.flows) {
    if (!Array.isArray(architecture.flows)) {
      errors.push('Flows must be an array');
    } else {
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

describe('validateProjectName', () => {
  it('accepts valid names', () => {
    expect(validateProjectName('My Project')).toBeNull();
  });

  it('rejects empty names', () => {
    expect(validateProjectName('')).toBe('Project name is required');
    expect(validateProjectName('   ')).toBe('Project name is required');
    expect(validateProjectName(null)).toBe('Project name is required');
  });

  it('rejects names over 200 chars', () => {
    expect(validateProjectName('A'.repeat(201))).toContain('too long');
    expect(validateProjectName('A'.repeat(200))).toBeNull();
  });
});

describe('validateArchitecture', () => {
  it('accepts valid architecture', () => {
    expect(validateArchitecture({ components: [{ name: 'Web App' }] })).toEqual([]);
  });

  it('rejects null/undefined', () => {
    expect(validateArchitecture(null)).toEqual(['Architecture must be an object']);
    expect(validateArchitecture(undefined)).toEqual(['Architecture must be an object']);
  });

  it('rejects missing components', () => {
    expect(validateArchitecture({})).toEqual(['Architecture must have a components array']);
  });

  it('rejects empty components array', () => {
    expect(validateArchitecture({ components: [] })).toEqual(['At least one component is required']);
  });

  it('rejects too many components', () => {
    const components = Array.from({ length: 51 }, (_, i) => ({ name: `C${i}` }));
    expect(validateArchitecture({ components })).toEqual([`Too many components (max ${MAX_COMPONENTS})`]);
  });

  it('rejects components without names', () => {
    expect(validateArchitecture({ components: [{ name: '' }, { name: 'Good' }] }))
      .toContain('Component 1 must have a name');
  });

  it('validates flows when present', () => {
    expect(validateArchitecture({ components: [{ name: 'A' }], flows: [{ from: 'A', to: 'B' }] })).toEqual([]);
    expect(validateArchitecture({ components: [{ name: 'A' }], flows: [{ from: 'A' }] }))
      .toContain("Flow 1 must have both 'from' and 'to' fields");
  });

  it('rejects non-array flows', () => {
    expect(validateArchitecture({ components: [{ name: 'A' }], flows: 'bad' })).toContain('Flows must be an array');
  });
});
