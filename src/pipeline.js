const fs = require('fs');
const path = require('path');
const { extractATS } = require('./extractors/ats');
const { extractGithub } = require('./extractors/github');
const { assertSameCandidate } = require('./engine/match');
const { mergeProfiles } = require('./engine/merge');
const { applyProjection } = require('./engine/project');

async function processCandidate(candidate, config) {
  
  const extracted = [];
  
  for (const source of candidate.sources) {
    
    let profile = null;
    
    if (source.type === 'ats_json') {
      const srcPath = path.resolve(process.cwd(), source.path);
      profile = extractATS(srcPath);
    } else if (source.type === 'github_api') {
      profile = await extractGithub(source.url);
    } else {
      console.warn(`Unknown source type "${source.type}" – skipping.`);
    }
    
    if (profile) {
      extracted.push({ source: source.type, profile });
    }
  }

  if (extracted.length > 1) {
    const anchor = extracted[0].profile;

    for (let i = 1; i < extracted.length; i++) {
      assertSameCandidate(anchor, extracted[i].profile, config);
    }
  }
  
  const merged = mergeProfiles(extracted, config);
  const final = applyProjection(merged, config);
  final.candidate_id = candidate.id;

  return final;
}


async function runPipeline({ inputs, configPath, outPath }) {
 
  const config = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), configPath), 'utf8'));

  const results = await Promise.all(inputs.map(candidate => processCandidate(candidate, config)));

  if (outPath) {
    const outFull = path.resolve(process.cwd(), outPath);
    fs.mkdirSync(path.dirname(outFull), { recursive: true });
    fs.writeFileSync(outFull, JSON.stringify(results, null, 2));
  }
  
  return results;
}

module.exports = { runPipeline };
