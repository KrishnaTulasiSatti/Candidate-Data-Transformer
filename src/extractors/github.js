const { createEmptyCanonical } = require('../utils/canonical');
const { normalizeFullName } = require('../normalizers/name');
const { normalizeEmail } = require('../normalizers/email');
const { normalizeLocation } = require('../normalizers/country');

async function extractGithub(url) {
  
  try {
   
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Eightfold-Candidate-Transformer-Bot'
      }
    });
   
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    

    const profile = createEmptyCanonical();
    
    
    if (data.name) {
      profile.full_name = normalizeFullName(data.name);
    }
    
   
    if (data.email) {
      
      const emailRegex = require('../../data/config.json').email_regex;
      const normalized = normalizeEmail(data.email, emailRegex);
      if (normalized) profile.emails = [normalized];
    }
    
 
    if (data.location) {
      profile.location = normalizeLocation(data.location);
    }
    
    
    if (data.bio) {
      profile.headline = data.bio;
    }
    
    profile.links.github = data.html_url;
    
    if (data.repos_url) {
      
      try {
       
        const reposResponse = await fetch(data.repos_url, {
          headers: { 'User-Agent': 'Eightfold-Candidate-Transformer-Bot' }
        });
  
        if (reposResponse.ok) {
         
          const reposData = await reposResponse.json();
          const languages = new Set();
          
         
          for (const repo of reposData) {
 
            profile.repos.push(repo.html_url);
            if (repo.language) {
              languages.add(repo.language);
            }
          }
          
         
          languages.forEach(lang => {
             profile.skills.push({ name: lang });
          });
          
        
          if (data.public_repos > 0) {
             profile.skills.push({ name: 'Git' });
          }
        }
      
      } catch (repoErr) {
        console.error(`Failed to fetch repos for ${url}:`, repoErr.message);
      }
    }
    

    return profile;
  } catch (error) {
  
    console.error(`Failed to extract Github data from ${url}:`, error.message);
    return null;
  }
}


module.exports = { extractGithub };
