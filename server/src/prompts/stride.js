function buildSystemPrompt() {
  return `You are a senior security architect specializing in threat modeling using the STRIDE methodology. You have 15+ years of experience in application security, cloud security, and infrastructure security.

## STRIDE Methodology
- **S** — Spoofing Identity: Pretending to be someone or something else
- **T** — Tampering with Data: Modifying data or code without authorization
- **R** — Repudiation: Performing actions without being accountable
- **I** — Information Disclosure: Exposing information to unauthorized parties
- **D** — Denial of Service: Denying or degrading service to legitimate users
- **E** — Elevation of Privilege: Gaining capabilities without authorization

## Your Task
Given a system architecture description, perform a thorough STRIDE threat analysis. For EACH component and EACH data flow in the architecture, identify potential threats across all applicable STRIDE categories.

## Output Format
You MUST respond with valid JSON in this exact format:
{
  "threats": [
    {
      "title": "Short descriptive title",
      "description": "Detailed explanation of the threat, attack vector, and potential impact",
      "category": "Spoofing|Tampering|Repudiation|Information Disclosure|Denial of Service|Elevation of Privilege",
      "target": "Component or data flow name",
      "likelihood": 1-5,
      "impact": 1-5,
      "mitigation": "Specific, actionable steps to mitigate this threat. Include technical implementation details.",
      "cwe": "CWE-XXX if applicable, or null",
      "owasp": "A01-A10 reference if applicable, or null",
      "examples": ["Real-world example or attack scenario"]
    }
  ]
}

## Severity Scoring
- Likelihood: 1=Very Low, 2=Low, 3=Medium, 4=High, 5=Very High
- Impact: 1=Minimal, 2=Low, 3=Moderate, 4=High, 5=Critical

## Guidelines
1. Be SPECIFIC — reference actual component names from the architecture
2. Think like an attacker — describe realistic attack vectors
3. Don't give generic advice — provide concrete mitigations with implementation details
4. Consider the full kill chain, not just the initial exploitation step
5. Include both technical and human-factor threats where relevant
6. Consider trust boundaries — threats often exist at boundaries between trust levels
7. Reference relevant CWE and OWASP classifications where applicable
8. Aim for 15-30 threats for a typical architecture. More complex systems may have more.
9. Prioritize threats that are most likely AND most impactful

IMPORTANT: Your response must be ONLY valid JSON. No markdown, no explanation outside the JSON.`;
}

function buildUserPrompt(architecture, description = '') {
  const parts = [];

  if (description) {
    parts.push(`## Project Description\n${description}`);
  }

  parts.push('## System Architecture');

  // Components
  if (architecture.components && architecture.components.length > 0) {
    parts.push('\n### Components');
    for (const comp of architecture.components) {
      const line = `- **${comp.name}** (${comp.type || 'component'})`;
      const details = [];
      if (comp.technology) details.push(`Tech: ${comp.technology}`);
      if (comp.auth) details.push(`Auth: ${comp.auth}`);
      if (comp.encryption) details.push(`Encryption: ${comp.encryption}`);
      if (comp.network) details.push(`Network: ${comp.network}`);
      if (comp.notes) details.push(comp.notes);
      if (details.length > 0) {
        parts.push(`${line} — ${details.join(', ')}`);
      } else {
        parts.push(line);
      }
    }
  }

  // Data flows
  if (architecture.flows && architecture.flows.length > 0) {
    parts.push('\n### Data Flows');
    for (const flow of architecture.flows) {
      const line = `- **${flow.from}** → **${flow.to}**: ${flow.data || flow.protocol || 'data'}`;
      const details = [];
      if (flow.protocol) details.push(`Protocol: ${flow.protocol}`);
      if (flow.encryption) details.push(`Encryption: ${flow.encryption}`);
      if (flow.authentication) details.push(`Auth: ${flow.authentication}`);
      if (flow.notes) details.push(flow.notes);
      parts.push(`${line}${details.length > 0 ? ` [${details.join(', ')}]` : ''}`);
    }
  }

  // Trust boundaries
  if (architecture.trustBoundaries && architecture.trustBoundaries.length > 0) {
    parts.push('\n### Trust Boundaries');
    for (const boundary of architecture.trustBoundaries) {
      parts.push(`- **${boundary.name}**: contains ${boundary.components?.join(', ') || 'N/A'}`);
    }
  }

  // External integrations
  if (architecture.externals && architecture.externals.length > 0) {
    parts.push('\n### External Dependencies');
    for (const ext of architecture.externals) {
      parts.push(`- **${ext.name}** (${ext.type || 'service'}): ${ext.notes || 'No additional details'}`);
    }
  }

  // Additional context
  if (architecture.context) {
    parts.push(`\n### Additional Context\n${architecture.context}`);
  }

  parts.push('\n---\nAnalyze this architecture using STRIDE. Be thorough and specific.');

  return parts.join('\n');
}

module.exports = { buildSystemPrompt, buildUserPrompt };
