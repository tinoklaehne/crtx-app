# Security

## Airtable API keys

- **Never commit `.env` or any file containing `NEXT_PUBLIC_AIRTABLE_API_KEY` or other secrets.** The repo’s `.gitignore` includes `.env` for this reason.
- If a key was ever committed (e.g. before `.env` was ignored), treat it as **compromised** and **rotate it immediately**:
  1. In [Airtable](https://airtable.com): **Account → Developer hub → Personal access tokens** (or where the token was created).
  2. **Revoke** the exposed token.
  3. **Create a new token** and use it only in:
     - **Local:** a new `.env` file (never committed).
     - **Vercel / production:** Project → Settings → Environment Variables.
- Do not paste API keys into issues, PRs, or docs.
