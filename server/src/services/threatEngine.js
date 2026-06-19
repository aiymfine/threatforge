const { buildSystemPrompt, buildUserPrompt } = require('../prompts/stride');
const { getLLMClient } = require('./llm');

async function generateThreatModel(architecture, description = '', overrides = {}) {
  const client = await getLLMClient();
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(architecture, description);

  const raw = await client.chat(systemPrompt, userPrompt);

  // Parse and validate
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    // Try to extract JSON from response
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('Failed to parse LLM response as JSON. Raw response:\n' + raw.slice(0, 500));
    }
  }

  const threats = parsed.threats || [];

  // Validate and normalize each threat
  return threats.map((threat, index) => ({
    id: `T-${String(index + 1).padStart(3, '0')}`,
    title: threat.title || threat.name || `Threat ${index + 1}`,
    description: threat.description || '',
    category: normalizeCategory(threat.category || threat.stride),
    target: threat.target || threat.component || '',
    likelihood: clamp(threat.likelihood || 3, 1, 5),
    impact: clamp(threat.impact || 3, 1, 5),
    severity: clamp(
      threat.severity || (threat.likelihood || 3) * (threat.impact || 3),
      1, 25
    ),
    mitigation: threat.mitigation || threat.remediation || '',
    cwe: threat.cwe || threat.cwe_id || null,
    owasp: threat.owasp || null,
    examples: threat.examples || []
  })).sort((a, b) => b.severity - a.severity);
}

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
  return mapping[cat] || cat;
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

module.exports = { generateThreatModel };
