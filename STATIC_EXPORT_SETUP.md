# Static Export Setup with Airtable API

This document explains how the Next.js application is set up to use the Airtable API for both development and production static export.

## Current Setup

The application is configured to:
1. **Use Airtable API**: Both development and production builds fetch radar IDs directly from Airtable
2. **Static Export**: Enabled with `output: 'export'` in `next.config.js`
3. **Environment Variables**: Configured in both `package.json` scripts and `netlify.toml`

## How It Works

### Development Mode
- Runs with `npm run dev`
- Environment variables are set in the package.json script
- Airtable API is called to fetch radar IDs dynamically
- Pages are generated on-demand

### Production Build
- Runs with `npm run build`
- Environment variables are set in the package.json script
- `generateStaticParams()` calls Airtable API during build time
- All radar pages are pre-generated as static files

## Environment Variables

Use **server-only** variables so the key is never bundled in client code (recommended):
- `AIRTABLE_API_KEY`: Your Airtable API key (server-only, not exposed to the browser)
- `AIRTABLE_BASE_ID`: Your Airtable base ID

Fallback (for migration): `NEXT_PUBLIC_AIRTABLE_API_KEY` and `NEXT_PUBLIC_AIRTABLE_BASE_ID` are still read if the server-only vars are not set. Prefer setting `AIRTABLE_*` and leaving `NEXT_PUBLIC_*` unset.

Configure in your deployment dashboard (e.g. Vercel, Netlify) or in `.env` for local development. Never commit `.env` or hardcode keys.

## Key Features

1. **Dynamic Radar IDs**: No hardcoded IDs - all fetched from Airtable
2. **Automatic Updates**: When you add/remove radars in Airtable, they're automatically included in the next build
3. **Static Export**: Full static site generation for optimal performance
4. **Error Handling**: Graceful fallbacks if Airtable API is unavailable

## Troubleshooting

If you encounter issues:

1. **API Key Issues**: Ensure your Airtable API key is valid and has proper permissions
2. **Build Failures**: Check that environment variables are properly set
3. **Missing Radars**: Verify that the Airtable base contains radar records

## Deployment

The application is ready for deployment on any static hosting platform:
- Netlify (configured in `netlify.toml`)
- Vercel
- GitHub Pages
- Any other static hosting service

## Resolving Build Error

To resolve the current build error, install the missing dependency:

```sh
npm install vaul
```

After installing, run `npm run build` again. If you have any more issues or want to further refine the Airtable integration, let me know!