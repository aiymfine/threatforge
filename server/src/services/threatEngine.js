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
    // Try to extract JSON from response (LLMs sometimes wrap in markdown code blocks)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('Failed to parse LLM response as JSON. Raw response:\n' + raw.slice(0, 500));
    }
  }

  const threats = parsed.threats || [];

  // Validate and normalize each threat
  return threats.map((threat, index) => {
    // Always compute severity as Likelihood × Impact for consistency
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
      severity: likelihood * impact, // Deterministic: L × I
      mitigation: String(threat.mitigation || threat.remediation || '').slice(0, 5000),
      cwe: threat.cwe || threat.cwe_id || null,
      owasp: threat.owasp || null,
      examples: Array.isArray(threat.examples)
        ? threat.examples.map(ex => String(ex).slice(0, 500))
        : []
    };
  }).sort((a, b) => b.severity - a.severity);
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
  return mapping[cat] || String(cat);
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

module.exports = { generateThreatModel, normalizeCategory, clamp };
