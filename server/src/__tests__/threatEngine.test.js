import { describe, it, expect } from 'vitest';

function normalizeCategory(cat) {
  const mapping = {
    'spoofing': 'Spoofing',
    'tampering': 'Tampering',
    'repudiation': 'Repudiation',
    'information-disclosure': 'Information Disclosure',
    'information disclosure': 'Information Disclosure',
    'denial-of-service': 'Denial of Service',
    'denial of service': 'Denial of Service',
    'elevation-of-privilege': 'Elevation of Privilege',
    'elevation of privilege': 'Elevation of Privilege',
    'S': 'Spoofing',
    'T': 'Tampering',
    'R': 'Repudiation',
    'I': 'Information Disclosure',
    'D': 'Denial of Service',
    'E': 'Elevation of Privilege'
  };
  return mapping[cat] || String(cat);
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

function normalizeThreat(threat, index) {
  const likelihood = clamp(threat.likelihood || 3, 1, 5);
  const impact = clamp(threat.impact || 3, 1, 5);
  return {
    id: `T-${String(index + 1).padStart(3, '0')}`,
    title: String(threat.title || threat.name || `Threat ${index + 1}`).slice(0, 200),
    description: String(threat.description || '').slice(0, 5000),
    category: normalizeCategory(threat.category || threat.stride),
    target: String(threat.target || threat.component || '').slice(0, 200),
    likelihood,
    impact,
    severity: likelihood * impact,
    mitigation: String(threat.mitigation || threat.remediation || '').slice(0, 5000),
    cwe: threat.cwe || threat.cwe_id || null,
    owasp: threat.owasp || null,
    examples: Array.isArray(threat.examples)
      ? threat.examples.map(ex => String(ex).slice(0, 500))
      : []
  };
}

describe('normalizeCategory', () => {
  it('normalizes lowercase to PascalCase', () => {
    expect(normalizeCategory('spoofing')).toBe('Spoofing');
    expect(normalizeCategory('tampering')).toBe('Tampering');
    expect(normalizeCategory('repudiation')).toBe('Repudiation');
    expect(normalizeCategory('denial of service')).toBe('Denial of Service');
    expect(normalizeCategory('elevation of privilege')).toBe('Elevation of Privilege');
  });

  it('normalizes kebab-case variants', () => {
    expect(normalizeCategory('information-disclosure')).toBe('Information Disclosure');
    expect(normalizeCategory('denial-of-service')).toBe('Denial of Service');
    expect(normalizeCategory('elevation-of-privilege')).toBe('Elevation of Privilege');
  });

  it('normalizes single-letter STRIDE shortcuts', () => {
    expect(normalizeCategory('S')).toBe('Spoofing');
    expect(normalizeCategory('T')).toBe('Tampering');
    expect(normalizeCategory('R')).toBe('Repudiation');
    expect(normalizeCategory('I')).toBe('Information Disclosure');
    expect(normalizeCategory('D')).toBe('Denial of Service');
    expect(normalizeCategory('E')).toBe('Elevation of Privilege');
  });

  it('passes through already-normalized values', () => {
    expect(normalizeCategory('Spoofing')).toBe('Spoofing');
    expect(normalizeCategory('Denial of Service')).toBe('Denial of Service');
  });

  it('returns stringified unknown values', () => {
    expect(normalizeCategory('Custom')).toBe('Custom');
    expect(normalizeCategory(null)).toBe('null');
  });
});

describe('clamp', () => {
  it('clamps values within range', () => {
    expect(clamp(3, 1, 5)).toBe(3);
    expect(clamp(5, 1, 5)).toBe(5);
    expect(clamp(1, 1, 5)).toBe(1);
  });

  it('clamps values below minimum', () => {
    expect(clamp(0, 1, 5)).toBe(1);
    expect(clamp(-10, 1, 5)).toBe(1);
  });

  it('clamps values above maximum', () => {
    expect(clamp(10, 1, 5)).toBe(5);
    expect(clamp(100, 1, 5)).toBe(5);
  });
});

describe('normalizeThreat', () => {
  it('computes severity as likelihood × impact', () => {
    const threat = normalizeThreat({ likelihood: 4, impact: 5, title: 'Test' }, 0);
    expect(threat.severity).toBe(20);
    expect(threat.likelihood).toBe(4);
    expect(threat.impact).toBe(5);
  });

  it('defaults likelihood and impact to 3 when missing', () => {
    const threat = normalizeThreat({ title: 'Test' }, 0);
    expect(threat.severity).toBe(9);
    expect(threat.likelihood).toBe(3);
    expect(threat.impact).toBe(3);
  });

  it('ignores LLM-provided severity field', () => {
    const threat = normalizeThreat({ likelihood: 2, impact: 2, severity: 25, title: 'Test' }, 0);
    expect(threat.severity).toBe(4);
  });

  it('assigns sequential IDs', () => {
    expect(normalizeThreat({ title: 'A' }, 0).id).toBe('T-001');
    expect(normalizeThreat({ title: 'B' }, 9).id).toBe('T-010');
  });

  it('truncates long strings', () => {
    const threat = normalizeThreat({ title: 'X'.repeat(300), description: 'Y'.repeat(6000) }, 0);
    expect(threat.title.length).toBe(200);
    expect(threat.description.length).toBe(5000);
  });

  it('handles missing fields gracefully', () => {
    const threat = normalizeThreat({}, 0);
    expect(threat.title).toBe('Threat 1');
    expect(threat.description).toBe('');
    expect(threat.cwe).toBeNull();
    expect(threat.examples).toEqual([]);
  });

  it('truncates example strings', () => {
    const threat = normalizeThreat({ title: 'T', examples: ['Z'.repeat(600), 'short'] }, 0);
    expect(threat.examples[0].length).toBe(500);
    expect(threat.examples[1]).toBe('short');
  });
});
