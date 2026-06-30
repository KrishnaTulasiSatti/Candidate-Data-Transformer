# Multi-Source Candidate Data Transformer

A Node.js pipeline that ingests candidate data from multiple heterogeneous sources (ATS JSON + GitHub API), normalizes it, merges it into a single canonical record, and outputs schema-valid JSON with provenance and confidence metadata.

---

## Features

- **Multi-source ingestion** — Structured ATS JSON and live GitHub API
- **Full normalization** — Name (title-case), email (lowercase + validation), phone (E.164), dates (ISO `YYYY-MM`), location (city/region/country)
- **Skill canonicalization** — Alias mapping via config (e.g. `JS` → `JavaScript`)
- **Confidence scoring** — Per-source, per-field weights multiplied by extraction quality; rounded to 2 decimal places
- **Merge strategies** — `highest_confidence_wins` for scalar fields; `extract_and_merge` (dedup) for arrays
- **Provenance tracking** — Every field in the output records its source and merge method
- **Graceful degradation** — Missing or failing sources are skipped; required-field violations surface as errors
- **CLI interface** — Simple flag-based invocation
- **54+ unit + integration tests** via Jest

---

## Project Structure

```
candidate-data-transformer/
├── data/
│   ├── config.json        # Schema, confidence weights, skill aliases, email regex
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
│   └── index.js           # CLI entry point
├── tests/
│   ├── normalizers/
│   │   ├── name.test.js
│   │   ├── email.test.js
│   │   ├── phone.test.js
│   │   ├── date.test.js
│   │   └── location.test.js
│   └── engine/
│       ├── merge.test.js
│       └── gold_profile.test.js
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

## Running the Pipeline

```bash
node src/index.js --batch data/inputs.json --config data/config.json --out output/final_candidate.json
```

| Flag | Description |
|---|---|
| `--batch` | Path to the batch inputs JSON (list of candidates) |
| `--config` | Path to the config JSON (schema, weights, aliases) |
| `--out` | Output file path for the merged profiles |

### Sample `inputs.json` entry

```json
[
  {
    "id": "candidate_01",
    "sources": [
      { "type": "ats_json", "path": "data/mock_ats.json" },
      { "type": "github_api", "url": "https://api.github.com/users/<username>" }
    ]
  }
]
```

---

## Running Tests

```bash
npm test
```

All tests live in the `tests/` folder and are picked up automatically by Jest.

```
Test Suites: 6 passed, 6 total
Tests:       54 passed, 54 total
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

## Output Schema

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
