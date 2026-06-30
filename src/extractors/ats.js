const fs = require('fs');
const { createEmptyCanonical } = require('../utils/canonical');
const { normalizeLocation } = require('../normalizers/country');
const { normalizeFullName } = require('../normalizers/name');
const { normalizeEmail } = require('../normalizers/email');

function extractATS(filePath) {
  try {
    const rawData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const profile = createEmptyCanonical();
    
    if (rawData.firstName && rawData.lastName) {
      profile.full_name = normalizeFullName(`${rawData.firstName} ${rawData.lastName}`);
    }
    
    if (rawData.contact) {
      if (rawData.contact.emailList) {
        // Validate and normalize each email; filter out invalid ones
        const emailRegex = require('../../data/config.json').email_regex;
        profile.emails = rawData.contact.emailList
          .map(e => normalizeEmail(e, emailRegex))
          .filter(Boolean);
      }
      if (rawData.contact.phoneNumber) {
        profile.phones = [rawData.contact.phoneNumber];
      }
    }
    
    if (rawData.address) {
      profile.location = normalizeLocation(rawData.address);
    }
    
    if (rawData.summary) {
      profile.headline = rawData.summary;
    }
    
    if (rawData.tagList) {
      profile.skills = rawData.tagList.map(t => ({ name: t }));
    }
    
    if (rawData.workHistory) {
      profile.experience = rawData.workHistory.map(w => ({
        company: w.employer,
        title: w.jobTitle,
        start: w.startDate,
        end: w.endDate,
        summary: w.description
      }));
    }
    
    if (rawData.schooling) {
      profile.education = rawData.schooling.map(s => ({
        institution: s.school,
        degree: s.degree,
        field: s.major,
        end_year: s.gradYear
      }));
    }
    
    return profile;
  } catch (error) {
    console.error(`Failed to extract ATS data from ${filePath}:`, error.message);
    return null;
  }
}

module.exports = { extractATS };
