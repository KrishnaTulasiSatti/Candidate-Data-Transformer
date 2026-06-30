const express = require('express');
const path = require('path');
const fs = require('fs');
const { runPipeline } = require('./pipeline');

// Simple token based auth – you can change this value or read it from an env var.
const API_TOKEN = process.env.API_TOKEN || 'my-secret-token';

const app = express();
app.use(express.json({ limit: '1mb' })); // body parser

/**
 * POST /process
 * Body: JSON array of candidate objects (same shape as data/inputs.json)
 * Query params (optional): config – path to config JSON (default: data/config.json)
 *                         out   – path to write output file (default: output/custom_candidate.json)
 * Header: x-api-key – must match API_TOKEN
 */
app.post('/process', async (req, res) => {
  const authHeader = req.header('x-api-key');
  if (authHeader !== API_TOKEN) {
    return res.status(401).json({ success: false, error: 'Invalid API token' });
  }

  const inputs = req.body;
  if (!Array.isArray(inputs)) {
    return res.status(400).json({ success: false, error: 'Request body must be an array of candidate inputs' });
  }

  // Determine which config is being used
  const configPath = req.query.config || path.resolve(process.cwd(), 'data/config.json');
  // If the caller supplied a custom config, derive the output name from that config file name.
  // Otherwise (default config) we write to a generic output1.json file.
  const defaultOut = path.resolve(process.cwd(), 'output', 'output1.json');
  const customOut = path.resolve(
    process.cwd(),
    'output',
    `${path.parse(configPath).name}_output1.json`
  );
  const outPath = req.query.out || (path.basename(configPath) === 'config.json' ? defaultOut : customOut);

  try {
    const results = await runPipeline({ inputs, configPath, outPath });
    // results already written to outPath inside runPipeline
    return res.json({ success: true, recordsWritten: results.length, data: results });
  } catch (e) {
    console.error('Server error:', e);
    return res.status(500).json({ success: false, error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
