const { normalizeEmail } = require('../normalizers/email');
const { normalizePhone } = require('../normalizers/phone');
const { normalizeFullName } = require('../normalizers/name');

function normalizeComparablePhone(phoneStr) {
  const normalized = normalizePhone(phoneStr);
  if (normalized) return normalized;

  if (!phoneStr || typeof phoneStr !== 'string') return null;

  const digits = phoneStr.replace(/\D/g, '');
  if (digits.length !== 10) return null;

  const indiaNormalized = normalizePhone(`+91${digits}`);
  if (indiaNormalized) return indiaNormalized;

  return normalizePhone(`+1${digits}`);
}

function normalizeGithubUrl(url) {
  if (!url || typeof url !== 'string') return null;

  let cleaned = url.trim();
  if (!cleaned) return null;

  cleaned = cleaned.replace(/\.git\/?$/i, '').replace(/\/$/, '');

  try {
    const parsed = new URL(cleaned);
    const protocol = parsed.protocol.toLowerCase();
    const hostname = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname.replace(/\/$/, '');
    return `${protocol}//${hostname}${pathname}`;
  } catch (_) {
    return cleaned.toLowerCase();
  }
}

function getNormalizedEmails(profile, config) {
  const regexStr = config && config.email_regex;
  return (profile && profile.emails ? profile.emails : [])
    .map(email => normalizeEmail(email, regexStr))
    .filter(Boolean);
}

function getNormalizedPhones(profile) {
  return (profile && profile.phones ? profile.phones : [])
    .map(phone => normalizeComparablePhone(phone))
    .filter(Boolean);
}

function getNormalizedGithubUrls(profile) {
  const links = (profile && profile.links) || {};
  const githubLinks = [links.github, links.github_url, links.githubUrl];

  return githubLinks
    .map(url => normalizeGithubUrl(url))
    .filter(Boolean);
}

function getNormalizedFullName(profile) {
  return normalizeFullName(profile && profile.full_name);
}

function getIdentitySignals(profile, config) {
  return {
    emails: getNormalizedEmails(profile, config),
    phones: getNormalizedPhones(profile),
    githubUrls: getNormalizedGithubUrls(profile),
    fullName: getNormalizedFullName(profile)
  };
}

function findSharedValue(leftValues, rightValues) {
  const rightSet = new Set(rightValues);
  return leftValues.find(value => rightSet.has(value)) || null;
}

function assertSameCandidate(leftProfile, rightProfile, config) {
  const left = getIdentitySignals(leftProfile, config);
  const right = getIdentitySignals(rightProfile, config);

  const sharedEmail = findSharedValue(left.emails, right.emails);
  if (sharedEmail) {
    return { matched: true, method: 'email', value: sharedEmail };
  }

  const sharedPhone = findSharedValue(left.phones, right.phones);
  if (sharedPhone) {
    return { matched: true, method: 'phone', value: sharedPhone };
  }

  const sharedGithubUrl = findSharedValue(left.githubUrls, right.githubUrls);
  if (sharedGithubUrl) {
    return { matched: true, method: 'github_url', value: sharedGithubUrl };
  }

  if (left.fullName && right.fullName && left.fullName === right.fullName) {
    return { matched: true, method: 'full_name', value: left.fullName };
  }

  throw new Error(
    'Candidate records do not match deterministically by email, phone, GitHub URL, or full name.'
  );
}

module.exports = { assertSameCandidate, normalizeGithubUrl };