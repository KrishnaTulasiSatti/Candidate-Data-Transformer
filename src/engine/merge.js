// Import lodash to help us filter out duplicates easily
const _ = require('lodash');
const { createEmptyCanonical } = require('../utils/canonical');


function getConfidence(config, sourceType, field) {

  const baseTable = (config && config.source_confidence) || {};
  const baseFallback = (config && config.default_confidence) || 0.5;
  const base = (baseTable[sourceType] && baseTable[sourceType][field]) || baseFallback;
  const qualityTable = (config && config.extraction_quality) || {};
  const quality = (qualityTable[sourceType] && qualityTable[sourceType][field]) || 1.0;
 
  return Number((base * quality).toFixed(2));
}


function calculateYearsExperience(experienceList) {
  
  if (!experienceList || experienceList.length === 0) return null;

 
  const now = new Date();

  
  const ranges = [];
 
  for (const exp of experienceList) {
   
    const start = new Date(exp.start);
   
    const endRaw = (!exp.end || String(exp.end).toLowerCase() === 'present') ? now : new Date(exp.end);
  
    if (!isNaN(start) && !isNaN(endRaw) && endRaw >= start) {
      ranges.push([start.getTime(), endRaw.getTime()]);
    }
  }


  if (ranges.length === 0) return null;

 
  ranges.sort((a, b) => a[0] - b[0]);
 
  const merged = [ranges[0]];
 
  for (let i = 1; i < ranges.length; i++) {
   
    const last = merged[merged.length - 1];
   
    if (ranges[i][0] <= last[1]) {
      last[1] = Math.max(last[1], ranges[i][1]);
    } else {
      merged.push(ranges[i]);
    }
  }

 
  const totalMs = merged.reduce((sum, [s, e]) => sum + (e - s), 0);
 
  const years = totalMs / (1000 * 60 * 60 * 24 * 365.25);

  return Number(years.toFixed(1));
}


function mergeProfiles(profilesWithSource, config) {
  
  const merged = createEmptyCanonical();
  merged.provenance = [];
  
 
  const bestConfidence = {};
  let totalConfidence = 0;
  let fieldCount = 0;

  for (const { source, profile } of profilesWithSource) {
   
    if (!profile) continue;
    
  
    if (profile.emails && profile.emails.length > 0) {

      merged.emails = _.uniq([...merged.emails, ...profile.emails]);
      merged.provenance.push({ field: 'emails', source, method: 'extract_and_merge' });

    }
    

    if (profile.phones && profile.phones.length > 0) {
      merged.phones = _.uniq([...merged.phones, ...profile.phones]);
      merged.provenance.push({ field: 'phones', source, method: 'extract_and_merge' });
    }
    
  
    if (profile.repos && profile.repos.length > 0) {
      merged.repos = _.uniq([...merged.repos, ...profile.repos]);
      merged.provenance.push({ field: 'repos', source, method: 'extract_and_merge' });
    }
    
   
    if (profile.skills && profile.skills.length > 0) {
     
      const aliasMap = (config && config.skill_aliases) || {};
    
      const existingSkillNames = new Set(merged.skills.map(s => s.name.toLowerCase()));
  
      for (const skill of profile.skills) {
        
        const aliasKey = Object.keys(aliasMap).find(k => k.toLowerCase() === skill.name.toLowerCase());
        
        const normalizedName = aliasKey ? aliasMap[aliasKey] : skill.name;
        
        const lowerName = normalizedName.toLowerCase();
        
        if (!existingSkillNames.has(lowerName)) {
         
          merged.skills.push({ name: normalizedName, confidence: getConfidence(config, source, 'skills'), sources: [source] });
        
          existingSkillNames.add(lowerName);
      
        } else {
          
          const existing = merged.skills.find(s => s.name.toLowerCase() === lowerName);
        
          if (existing && !existing.sources.includes(source)) {
           
            existing.sources.push(source);
           
            existing.confidence = Math.max(existing.confidence, getConfidence(config, source, 'skills'));
          }
        }
      }

      merged.provenance.push({ field: 'skills', source, method: 'extract_and_merge' });
    }

  
    if (profile.experience && profile.experience.length > 0) {
  
      merged.experience = [...merged.experience, ...profile.experience];
      merged.provenance.push({ field: 'experience', source, method: 'extract_and_merge' });
    }
    
 
    if (profile.education && profile.education.length > 0) {
    
      merged.education = [...merged.education, ...profile.education];
      merged.provenance.push({ field: 'education', source, method: 'extract_and_merge' });
    }
    
    const singleFields = ['full_name', 'location', 'headline'];
    for (const field of singleFields) {

      if (profile[field]) {
        
        const conf = getConfidence(config, source, field);
        
        if (!bestConfidence[field] || conf > bestConfidence[field]) {
         
          merged[field] = profile[field];
          
          bestConfidence[field] = conf;
         
          merged.provenance = merged.provenance.filter(p => p.field !== field);
      
          merged.provenance.push({ field, source, method: 'highest_confidence_wins' });
        }
      }
    }
    
   
    if (profile.links) {
      
       for (const [key, val] of Object.entries(profile.links)) {
       
           if(val) {
            
               merged.links[key] = val;
              
               merged.provenance.push({ field: `links.${key}`, source, method: 'extract_and_merge' });
           }
       }
    }
  }
  
 
  for(const val of Object.values(bestConfidence)) {
     
      totalConfidence += val;
      fieldCount++;
  }
  
  
  merged.overall_confidence = fieldCount > 0 ? Number((totalConfidence / fieldCount).toFixed(2)) : 0;

  merged.years_experience = calculateYearsExperience(merged.experience);

  if (merged.years_experience !== null) {
    merged.provenance.push({ field: 'years_experience', source: 'computed', method: 'date_range_sum' });
  }

 
  return merged;
}

module.exports = { mergeProfiles };
