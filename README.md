# Multi-Source Candidate Data Transformer

A Node.js pipeline that ingests candidate data from multiple heterogeneous sources (ATS JSON + GitHub API), normalizes it, merges it into a single canonical record, and outputs schema-valid JSON with provenance and confidence metadata. 

It can be run as a **CLI tool** or as a **REST API**.

---

## Features

- **Multi-source ingestion** — Structured ATS JSON and live GitHub API
- **Full normalization** — Name (title-case), email (lowercase + validation), phone (E.164), dates (ISO `YYYY-MM`), location (city/region/country)
- **Skill canonicalization** — Alias mapping via config (e.g. `JS` → `JavaScript`)
- **Confidence scoring** — Per-source, per-field weights multiplied by extraction quality; rounded to 2 decimal places
- **Merge strategies** — `highest_confidence_wins` for scalar fields; `extract_and_merge` (dedup) for arrays
- **Provenance tracking** — Every field in the output records its source and merge method
- **Graceful degradation** — Missing or failing sources are skipped; required-field violations surface as errors
- **High-Performance Scaling** — Processes thousands of candidates in parallel using asynchronous Promise mapping.
- **REST API Endpoint** — Includes an Express server to process requests dynamically via HTTP POST.
- **CLI interface** — Simple flag-based invocation
- **65 unit + integration tests** via Jest

---

## Libraries Used

This project was built using lightweight, enterprise-standard libraries to ensure maintainability and performance without bloating the codebase:

- **[Express.js](https://expressjs.com/)** — Used to build the REST API endpoint (`src/server.js`), providing a robust and scalable way to handle HTTP POST requests and JSON payloads.
- **[Lodash](https://lodash.com/)** — A powerful utility library used heavily in the Merge Engine (`src/engine/merge.js`) for deep object retrieval (`_.get`) and array deduplication (`_.uniq`), ensuring clean data manipulation.
- **[libphonenumber-js](https://gitlab.com/catamphetamine/libphonenumber-js)** — A precise telecom parsing library used in `src/normalizers/phone.js` to mathematically convert messy, unstructured phone strings into globally standardized `E.164` formats.
- **[Jest](https://jestjs.io/)** — The industry-standard testing framework used to build our 65-test suite, ensuring absolute reliability of all extraction, normalization, and merging logic.
- **Native Fetch API** — Used natively (Node 18+) to make asynchronous requests to the GitHub API without needing external HTTP clients like Axios.

---

## Project Structure

```
candidate-data-transformer/
├── data/
│   ├── config.json        # Schema, confidence weights, skill aliases, email regex
│   ├── custom_config.json # Alternative custom projection schema
│   ├── inputs.json        # Batch input: list of candidates with source pointers
│   └── mock_ats.json      # Sample ATS payload
├── src/
│   ├── extractors/
│   │   ├── ats.js         # Reads ATS JSON file → canonical profile
│   │   └── github.js      # Calls GitHub API → canonical profile
│   ├── normalizers/
│   │   ├── name.js        # Full-name title-casing
│   │   ├── email.js       # Lowercase + regex validation
│   │   ├── phone.js       # E.164 via libphonenumber-js
│   │   ├── date.js        # Multi-format → YYYY-MM
│   │   └── country.js     # Location string → { city, region, country }
│   ├── engine/
│   │   ├── merge.js       # Merges profiles; computes confidence & years_experience
│   │   └── project.js     # Applies config field schema to canonical profile
│   ├── utils/
│   │   └── canonical.js   # Empty canonical profile factory
│   ├── pipeline.js        # Core pipeline logic (shared by CLI and API)
│   ├── server.js          # Express HTTP API server
│   └── index.js           # CLI entry point
├── tests/
│   ├── normalizers/       # 5 normalizer test suites
│   └── engine/            # 2 merge & projection test suites
└── output/
    └── final_candidate.json  # Pipeline output
```

---

## Prerequisites

- **Node.js** v18 or later (native `fetch` required)
- **npm** v8+

---

## Installation

```bash
npm install
```

---

## 1. Running via HTTP API (Recommended)

Start the server:

```bash
npm start
# 🚀 Server listening on http://localhost:3000
```

Send a POST request (using PowerShell):

```powershell
curl.exe -X POST "http://localhost:3000/process" `
  -H "Content-Type: application/json" `
  -H "x-api-key: my-secret-token" `
  -d @data/inputs.json
```

**Options:**
- `?config=path/to/config.json`: Override the default configuration schema.
- `?out=path/to/output.json`: Override the output destination. By default, files are written to the `output/` directory and intelligently named based on the config used (e.g. `output1.json` or `custom_config_output1.json`).
- `x-api-key`: Simple token auth. Defaults to `my-secret-token`. Can be overridden by setting the `API_TOKEN` environment variable before starting the server.

---

## 2. Running via CLI

```bash
node src/index.js --batch data/inputs.json --config data/config.json --out output/final_candidate.json
```

| Flag | Description |
|---|---|
| `--batch` | Path to the batch inputs JSON (list of candidates) |
| `--config` | Path to the config JSON (schema, weights, aliases) |
| `--out` | Output file path for the merged profiles |

---

## Running Tests

```bash
npm test
```

All tests live in the `tests/` folder and are picked up automatically by Jest.

```
Test Suites: 7 passed, 7 total
Tests:       65 passed, 65 total
```

---

## Configuration (`data/config.json`)

| Key | Purpose |
|---|---|
| `fields` | Output schema — which canonical fields to include and how to map them |
| `source_confidence` | Per-source, per-field base confidence scores |
| `extraction_quality` | Multiplier applied on top of base confidence to reflect data quality |
| `default_confidence` | Fallback confidence when no specific value is configured (default: `0.5`) |
| `skill_aliases` | Maps non-canonical skill names to canonical ones (e.g. `JS → JavaScript`) |
| `email_regex` | Regex used to validate emails during extraction |
| `include_provenance` | If `true`, provenance array is included in output |
| `on_missing` | Behaviour when a field is missing: `"null"`, `"omit"`, or `"error"` |

---

## Output Schema Example

```json
{
  "full_name": "string",
  "primary_email": "string",
  "primary_phone": "E.164 string",
  "location": { "city": "string", "region": "string", "country": "ISO-2" },
  "links": { "github": "url" },
  "headline": "string",
  "years_experience": "number",
  "skills": [{ "name": "string", "confidence": "number", "sources": ["string"] }],
  "experience": [{ "company": "string", "title": "string", "start": "string", "end": "string", "summary": "string" }],
  "education": [{ "institution": "string", "degree": "string", "field": "string", "end_year": "number" }],
  "overall_confidence": "number",
  "provenance": [{ "field": "string", "source": "string", "method": "string" }],
  "candidate_id": "string"
}
```

---

## Assumptions & Descoped Items

- **GitHub API** is public (no auth token). Rate limits apply (60 req/hr unauthenticated).
- **Location parsing** uses comma-split heuristics + a country map; a geocoding library would improve accuracy.
- **Date formats** supported: ISO 8601, `Jan 2024`, `Jan-2024`, `YYYY/MM/DD`, `"present"`.
- **Unstructured sources** (PDF résumés, LinkedIn HTML) are out of scope for this implementation.
- A demo video link should be added here once recorded.
