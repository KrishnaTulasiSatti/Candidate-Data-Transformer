/*
 * Updated CLI entry‑point – now delegates to the shared pipeline module.
 * This file remains a thin wrapper so existing commands keep working.
 */

const { runPipeline } = require('./pipeline');

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
    const inputs = JSON.parse(require('fs').readFileSync(batchPath, 'utf8'));
    const results = await runPipeline({ inputs, configPath, outPath });
    console.log(`Successfully wrote ${results.length} records to ${outPath}`);
  } catch (e) {
    console.error('Fatal error:', e.message);
    process.exit(1);
  }
}

run();
