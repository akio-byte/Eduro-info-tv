# AGENTS.md

## Goal
Audit this repository for production readiness, Vercel suitability, Supabase fit, and architectural coherence.

## Rules
- Audit first, do not change code unless explicitly asked.
- Prefer evidence from files, schema, migrations, scripts, and build outputs.
- Distinguish confirmed findings from inference and live-only checks.
- Keep recommendations minimal-change and production-minded.

## Key checks
- package.json
- vite config
- router / SPA deep-link behavior
- env handling
- Supabase client, schema, migrations, RLS, storage
- admin vs display coupling
- build output and bundle size
- dead code / half-integrated features

## Output
Return final report in Finnish with:
1) Status
2) Analyysi
3) Suositus
plus an audit trail appendix.
