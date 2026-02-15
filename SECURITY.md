# Security

## Airtable API keys

- **Use server-only env vars when possible:** Prefer `AIRTABLE_API_KEY` and `AIRTABLE_BASE_ID` (no `NEXT_PUBLIC_` prefix) so the key is never bundled or exposed to the browser. The app reads these first and falls back to `NEXT_PUBLIC_AIRTABLE_*` if unset.
- **Never commit `.env` or any file containing API keys or other secrets.** The repo’s `.gitignore` includes `.env` for this reason.
- If a key was ever committed, treat it as **compromised** and **rotate it immediately** in Airtable, then set the new key only in env (local `.env` or deployment dashboard).
- Do not paste API keys into issues, PRs, or config files (e.g. `netlify.toml`). Set them in the host’s environment variables UI instead.
