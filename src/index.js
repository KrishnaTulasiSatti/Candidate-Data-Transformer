const fs = require('fs');
const path = require('path');
const { extractATS } = require('./extractors/ats');
const { extractGithub } = require('./extractors/github');
const { mergeProfiles } = require('./engine/merge');
const { applyProjection } = require('./engine/project');

async function processCandidate(candidate, config) {
  const extractedProfiles = [];
  
  for (const source of candidate.sources) {
    let profile = null;
    
    if (source.type === 'ats_json') {
      const sourcePath = path.resolve(process.cwd(), source.path);
      profile = extractATS(sourcePath);
    } else if (source.type === 'github_api') {
      profile = await extractGithub(source.url);
    }
    
    if (profile) {
      extractedProfiles.push({ source: source.type, profile });
    }
  }
  
  const canonicalProfile = mergeProfiles(extractedProfiles, config);
  
  try {
    const finalProfile = applyProjection(canonicalProfile, config);
    finalProfile.candidate_id = candidate.id;
    return { success: true, id: candidate.id, data: finalProfile };
  } catch (err) {
    console.error(`Failed to project candidate ${candidate.id}:`, err.message);
    return { success: false, id: candidate.id, error: err.message };
  }
}

async function run() {
  const args = process.argv.slice(2);
  let batchPath, configPath, outPath;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--batch') batchPath = args[++i];
    if (args[i] === '--config') configPath = args[++i];
    if (args[i] === '--out') outPath = args[++i];
  }

  if (!batchPath || !configPath || !outPath) {
    console.error('Usage: node index.js --batch <inputs.json> --config <config.json> --out <output.json>');
    process.exit(1);
  }

  try {
    const inputs = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), batchPath), 'utf8'));
    const config = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), configPath), 'utf8'));
    
    const results = [];
    for (const candidate of inputs) {
      const result = await processCandidate(candidate, config);
      if (result.success) {
        results.push(result.data);
      }
    }
    
    fs.mkdirSync(path.dirname(path.resolve(process.cwd(), outPath)), { recursive: true });
    fs.writeFileSync(path.resolve(process.cwd(), outPath), JSON.stringify(results, null, 2));
    console.log(`Successfully wrote ${results.length} records to ${outPath}`);
    
  } catch (err) {
    console.error('Fatal error:', err.message);
    process.exit(1);
  }
}

run();
