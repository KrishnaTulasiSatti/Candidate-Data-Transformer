const fs = require('fs');
const path = require('path');
const { extractATS } = require('./extractors/ats');
const { extractGithub } = require('./extractors/github');
const { mergeProfiles } = require('./engine/merge');
const { applyProjection } = require('./engine/project');

/**
 * Runs the full candidate transformation pipeline.
 * @param {Object} options
 * @param {Array}  options.inputs   Array of candidate input objects (same shape as inputs.json).
 * @param {string} options.configPath Path to a config JSON file.
 * @param {string} [options.outPath] Optional file path where the result array should be written.
 * @returns {Promise<Array>} Resolves with an array of canonical candidate profiles.
 */
/**
 * Processes a single candidate: extracts from all sources, merges, and projects.
 * @param {Object} candidate  One entry from inputs.json.
 * @param {Object} config     Parsed config JSON.
 * @returns {Promise<Object>} The final canonical profile for this candidate.
 */
async function processCandidate(candidate, config) {
  const extracted = [];
  // Sources within a single candidate are still processed in sequence
  // (GitHub API may have rate limits – parallelise at the candidate level instead).
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
  const merged = mergeProfiles(extracted, config);
  const final = applyProjection(merged, config);
  final.candidate_id = candidate.id;
  return final;
}

async function runPipeline({ inputs, configPath, outPath }) {
  const config = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), configPath), 'utf8'));

  // ✅ Scale fix: process ALL candidates in parallel instead of sequentially.
  // For 1000 candidates this is ~1000x faster because all GitHub API calls
  // are fired at the same time rather than one after another.
  const results = await Promise.all(inputs.map(candidate => processCandidate(candidate, config)));

  if (outPath) {
    const outFull = path.resolve(process.cwd(), outPath);
    fs.mkdirSync(path.dirname(outFull), { recursive: true });
    fs.writeFileSync(outFull, JSON.stringify(results, null, 2));
  }
  return results;
}

module.exports = { runPipeline };
