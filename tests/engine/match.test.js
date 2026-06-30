const path = require('path');
const config = require(path.resolve(__dirname, '../../data/config.json'));
const { assertSameCandidate, normalizeGithubUrl } = require('../../src/engine/match');

function makeProfile(overrides = {}) {
  return {
    full_name: null,
    emails: [],
    phones: [],
    links: {},
    ...overrides
  };
}

describe('candidate matching strategy', () => {
  test('matches by email first', () => {
    const result = assertSameCandidate(
      makeProfile({ full_name: 'John Smith', emails: ['john@gmail.com'] }),
      makeProfile({ full_name: 'John A. Smith', emails: ['john@gmail.com'] }),
      config
    );

    expect(result).toEqual(expect.objectContaining({ matched: true, method: 'email' }));
  });

  test('matches by normalized phone number when email is absent', () => {
    const result = assertSameCandidate(
      makeProfile({ phones: ['+919876543210'] }),
      makeProfile({ phones: ['9876543210'] }),
      config
    );

    expect(result).toEqual(expect.objectContaining({ matched: true, method: 'phone' }));
  });

  test('matches by GitHub URL when email and phone are absent', () => {
    const result = assertSameCandidate(
      makeProfile({ links: { github: 'https://github.com/johnsmith/' } }),
      makeProfile({ links: { github: 'https://github.com/johnsmith' } }),
      config
    );

    expect(result).toEqual(expect.objectContaining({ matched: true, method: 'github_url' }));
  });

  test('falls back to exact normalized full name match', () => {
    const result = assertSameCandidate(
      makeProfile({ full_name: 'john   smith' }),
      makeProfile({ full_name: 'John Smith' }),
      config
    );

    expect(result).toEqual(expect.objectContaining({ matched: true, method: 'full_name' }));
  });

  test('throws when no deterministic identity field matches', () => {
    expect(() => {
      assertSameCandidate(
        makeProfile({ full_name: 'John Smith', emails: ['john@gmail.com'] }),
        makeProfile({ full_name: 'Jane Smith', emails: ['jane@gmail.com'] }),
        config
      );
    }).toThrow('Candidate records do not match deterministically');
  });
});

describe('normalizeGithubUrl', () => {
  test('strips trailing slash and .git suffix', () => {
    expect(normalizeGithubUrl('https://github.com/johnsmith.git/')).toBe('https://github.com/johnsmith');
  });
});