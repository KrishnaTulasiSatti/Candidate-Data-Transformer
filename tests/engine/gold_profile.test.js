// tests/engine/gold_profile.test.js
/**
 * Gold-profile comparison test.
 * Merges a known ATS + GitHub fixture and compares against the expected "gold" output.
 * This catches regressions across the entire pipeline in one shot.
 */
const path = require('path');
const config = require(path.resolve(__dirname, '../../data/config.json'));
const { mergeProfiles } = require('../../src/engine/merge');

// ── Fixtures ─────────────────────────────────────────────────────────────────

const atsProfile = {
  full_name: 'Jane Doe',
  emails: ['jane.doe@example.com'],
  phones: ['+14155552671'],
  location: { city: 'San Francisco', region: 'California', country: 'US' },
  headline: 'Senior Software Engineer',
  skills: [
    { name: 'JS' },         // alias → JavaScript
    { name: 'Python' },
    { name: 'Docker' }
  ],
  experience: [
    { company: 'Acme Corp', title: 'Engineer', start: '2020-01-01', end: '2022-01-01' }
  ],
  education: [
    { institution: 'MIT', degree: 'B.S.', field: 'CS', end_year: 2019 }
  ],
  repos: [],
  links: {}
};

const githubProfile = {
  full_name: 'Jane Doe',
  emails: ['jane@github.com'],
  phones: [],
  location: { city: 'San Francisco', region: null, country: 'US' },
  headline: 'Open source enthusiast | Python & JS developer',
  skills: [
    { name: 'JavaScript' }, // same as alias-resolved JS above
    { name: 'TypeScript' }
  ],
  experience: [],
  education: [],
  repos: ['https://github.com/janedoe/awesome-project'],
  links: { github: 'https://github.com/janedoe' }
};

// ── Gold expected values ──────────────────────────────────────────────────────

describe('Gold profile comparison', () => {
  let merged;

  beforeAll(() => {
    merged = mergeProfiles([
      { source: 'ats_json', profile: atsProfile },
      { source: 'github_api', profile: githubProfile }
    ], config);
  });

  test('full_name is correctly title-cased', () => {
    expect(merged.full_name).toBe('Jane Doe');
  });

  test('emails merged from both sources without duplicates', () => {
    expect(merged.emails).toContain('jane.doe@example.com');
    expect(merged.emails).toContain('jane@github.com');
    expect(merged.emails.length).toBe(2);
  });

  test('JS alias resolved to JavaScript — no duplicate skill', () => {
    const names = merged.skills.map(s => s.name);
    expect(names).toContain('JavaScript');
    expect(names.filter(n => n === 'JavaScript').length).toBe(1);
    expect(names).not.toContain('JS');
  });

  test('TypeScript (GitHub-only skill) is present', () => {
    expect(merged.skills.map(s => s.name)).toContain('TypeScript');
  });

  test('JavaScript skill lists both sources', () => {
    const js = merged.skills.find(s => s.name === 'JavaScript');
    expect(js.sources).toEqual(expect.arrayContaining(['ats_json', 'github_api']));
  });

  test('years_experience computed correctly from ATS data', () => {
    // 2020-01-01 to 2022-01-01 = 2 years
    expect(merged.years_experience).toBeCloseTo(2.0, 0);
  });

  test('headline picked from github_api (higher confidence)', () => {
    // github_api headline confidence 0.8 > ats_json 0.5
    expect(merged.headline).toBe('Open source enthusiast | Python & JS developer');
  });

  test('github link present from GitHub source', () => {
    expect(merged.links.github).toBe('https://github.com/janedoe');
  });

  test('repos merged from GitHub source', () => {
    expect(merged.repos).toContain('https://github.com/janedoe/awesome-project');
  });

  test('overall_confidence is populated and between 0–1', () => {
    expect(merged.overall_confidence).toBeGreaterThan(0);
    expect(merged.overall_confidence).toBeLessThanOrEqual(1);
  });

  test('provenance contains entries for all major fields', () => {
    const fields = merged.provenance.map(p => p.field);
    expect(fields).toContain('emails');
    expect(fields).toContain('skills');
    expect(fields).toContain('full_name');
    expect(fields).toContain('years_experience');
  });
});
