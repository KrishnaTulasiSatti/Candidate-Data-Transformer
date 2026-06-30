function createEmptyCanonical() {
  return {
    full_name: null,
    emails: [],
    phones: [],
    location: null,
    links: {},
    headline: null,
    years_experience: null,
    skills: [],
    experience: [],
    education: [],
    repos: []
  };
}

module.exports = { createEmptyCanonical };
