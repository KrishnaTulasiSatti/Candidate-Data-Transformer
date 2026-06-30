// tests/engine/merge.test.js
const path = require('path');
const config = require(path.resolve(__dirname, '../../data/config.json'));
const { mergeProfiles } = require('../../src/engine/merge');

function makeProfile(overrides = {}) {
  return {
    full_name: null,
    emails: [],
    phones: [],
    skills: [],
    experience: [],
    education: [],
    repos: [],
    location: null,
    headline: null,
    links: {},
    ...overrides
  };
}

describe('mergeProfiles - skill alias mapping', () => {
  test('resolves JS alias to JavaScript', () => {
    const profiles = [
      { source: 'ats_json', profile: makeProfile({ skills: [{ name: 'JS' }] }) },
      { source: 'github_api', profile: makeProfile({ skills: [{ name: 'JavaScript' }] }) }
    ];
    const merged = mergeProfiles(profiles, config);
    const names = merged.skills.map(s => s.name);
    expect(names).toContain('JavaScript');
    expect(names.filter(n => n === 'JavaScript').length).toBe(1); // no duplicate
    expect(names).not.toContain('JS');
  });

  test('resolves HTML5 alias to HTML', () => {
    const profiles = [
      { source: 'github_api', profile: makeProfile({ skills: [{ name: 'HTML5' }] }) }
    ];
    const merged = mergeProfiles(profiles, config);
    expect(merged.skills.map(s => s.name)).toContain('HTML');
  });

  test('unaliased skill passes through unchanged', () => {
    const profiles = [
      { source: 'ats_json', profile: makeProfile({ skills: [{ name: 'Docker' }] }) }
    ];
    const merged = mergeProfiles(profiles, config);
    expect(merged.skills.map(s => s.name)).toContain('Docker');
  });
});

describe('mergeProfiles - confidence', () => {
  test('confidence is rounded to 2 decimal places', () => {
    const profiles = [
      { source: 'ats_json', profile: makeProfile({ skills: [{ name: 'React' }] }) }
    ];
    const merged = mergeProfiles(profiles, config);
    const conf = merged.skills[0].confidence;
    expect(String(conf)).toMatch(/^\d+\.\d{1,2}$/); // max 2 decimal places
  });

  test('skill found in 2 sources gets higher confidence', () => {
    const profiles = [
      { source: 'ats_json', profile: makeProfile({ skills: [{ name: 'Python' }] }) },
      { source: 'github_api', profile: makeProfile({ skills: [{ name: 'Python' }] }) }
    ];
    const merged = mergeProfiles(profiles, config);
    const python = merged.skills.find(s => s.name === 'Python');
    expect(python.sources).toEqual(expect.arrayContaining(['ats_json', 'github_api']));
    // github_api has higher skill confidence (0.9 * 0.95 = 0.855, stored as 0.85 after toFixed(2))
    expect(python.confidence).toBeCloseTo(0.85, 1);
  });

  test('overall_confidence is between 0 and 1', () => {
    const profiles = [
      { source: 'ats_json', profile: makeProfile({ full_name: 'Alice', emails: ['a@b.com'] }) }
    ];
    const merged = mergeProfiles(profiles, config);
    expect(merged.overall_confidence).toBeGreaterThanOrEqual(0);
    expect(merged.overall_confidence).toBeLessThanOrEqual(1);
  });
});

describe('mergeProfiles - years_experience', () => {
  test('calculates years from non-overlapping ranges', () => {
    const profiles = [
      {
        source: 'ats_json',
        profile: makeProfile({
          experience: [
            { start: '2020-01-01', end: '2021-01-01' },
            { start: '2021-06-01', end: '2022-06-01' }
          ]
        })
      }
    ];
    const merged = mergeProfiles(profiles, config);
    expect(merged.years_experience).toBeCloseTo(2.0, 1);
  });

  test('merges overlapping date ranges before summing', () => {
    const profiles = [
      {
        source: 'ats_json',
        profile: makeProfile({
          experience: [
            { start: '2020-01-01', end: '2021-01-01' },
            { start: '2020-06-01', end: '2021-06-01' } // overlaps
          ]
        })
      }
    ];
    const merged = mergeProfiles(profiles, config);
    // Combined 2020-01-01 to 2021-06-01 = ~1.4-1.5 years depending on exact day count
    expect(merged.years_experience).toBeGreaterThan(1.3);
    expect(merged.years_experience).toBeLessThan(1.6);
  });

  test('handles "present" as end date', () => {
    const profiles = [
      {
        source: 'ats_json',
        profile: makeProfile({
          experience: [{ start: '2023-01-01', end: 'present' }]
        })
      }
    ];
    const merged = mergeProfiles(profiles, config);
    expect(merged.years_experience).toBeGreaterThan(0);
  });

  test('returns null when experience list is empty', () => {
    const profiles = [
      { source: 'ats_json', profile: makeProfile({ experience: [] }) }
    ];
    const merged = mergeProfiles(profiles, config);
    expect(merged.years_experience).toBeNull();
  });

  test('skips entries with invalid dates', () => {
    const profiles = [
      {
        source: 'ats_json',
        profile: makeProfile({
          experience: [
            { start: 'not-a-date', end: '2021-01-01' },
            { start: '2020-01-01', end: '2021-01-01' }
          ]
        })
      }
    ];
    const merged = mergeProfiles(profiles, config);
    expect(merged.years_experience).toBeCloseTo(1.0, 1);
  });
});

describe('mergeProfiles - provenance', () => {
  test('records provenance for each field', () => {
    const profiles = [
      { source: 'ats_json', profile: makeProfile({ full_name: 'Alice', emails: ['a@b.com'] }) }
    ];
    const merged = mergeProfiles(profiles, config);
    const fields = merged.provenance.map(p => p.field);
    expect(fields).toContain('full_name');
    expect(fields).toContain('emails');
  });

  test('highest_confidence_wins selects best source for single fields', () => {
    const profiles = [
      { source: 'ats_json', profile: makeProfile({ headline: 'ATS headline' }) },
      { source: 'github_api', profile: makeProfile({ headline: 'GitHub bio' }) }
    ];
    const merged = mergeProfiles(profiles, config);
    // github_api headline confidence = 0.8; ats_json = 0.5
    expect(merged.headline).toBe('GitHub bio');
    const prov = merged.provenance.find(p => p.field === 'headline');
    expect(prov.source).toBe('github_api');
    expect(prov.method).toBe('highest_confidence_wins');
  });
});

describe('mergeProfiles - graceful degradation', () => {
  test('handles null profile gracefully', () => {
    const profiles = [
      { source: 'ats_json', profile: null },
      { source: 'github_api', profile: makeProfile({ full_name: 'Bob' }) }
    ];
    const merged = mergeProfiles(profiles, config);
    expect(merged.full_name).toBe('Bob');
  });

  test('handles empty sources array', () => {
    const merged = mergeProfiles([], config);
    expect(merged.full_name).toBeNull();
    expect(merged.skills).toEqual([]);
  });
});
