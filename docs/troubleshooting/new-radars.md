# Handling New Radars

When new radars are created in Airtable, they may not immediately appear in the static site. This is because the site is pre-built with the radars that existed at build time.

## Automatic Detection

The application includes automatic detection for new radars:

1. **Client-side Detection**: When a user visits a radar URL that doesn't exist in the static build, the `RadarNotFoundHandler` component automatically checks for new radars in Airtable.

2. **API Endpoint**: The `/api/regenerate` endpoint fetches the latest radar data from Airtable.

3. **Automatic Redirect**: If a new radar is found, the user is automatically redirected to the radar page.

## Manual Regeneration

To manually regenerate the static site to include new radars:

### Option 1: Using the npm script
```bash
npm run regenerate
```

### Option 2: Manual build
```bash
npm run build
```

## Deployment Workflow

For production deployments, consider these workflows:

### Option 1: Scheduled Regeneration
Set up a cron job or GitHub Actions workflow to periodically regenerate the site:

```yaml
# .github/workflows/regenerate.yml
name: Regenerate Static Site
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:  # Manual trigger

jobs:
  regenerate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22'
      - run: npm install
      - run: npm run regenerate
      - run: npm run deploy  # Your deployment command
```

### Option 2: Webhook-based Regeneration
Set up a webhook that triggers regeneration when Airtable data changes:

1. Create a webhook endpoint that receives Airtable webhooks
2. Trigger the regeneration script when radar data changes
3. Deploy the updated static site

## Troubleshooting

### Radar Not Found Error
If you see "Radar Not Found" for a radar that exists in Airtable:

1. Check that the radar ID is correct
2. Verify the radar exists in Airtable
3. Try the "Check for New Radar" button
4. Manually regenerate the site if needed

### Build Failures
If the build fails when new radars are added:

1. Check Airtable API credentials
2. Verify network connectivity
3. Check for malformed radar data in Airtable
4. Review build logs for specific errors

## Best Practices

1. **Regular Regeneration**: Set up automated regeneration every few hours
2. **Monitor Builds**: Watch for build failures and fix them promptly
3. **Test New Radars**: Verify new radars work before deploying
4. **Backup Strategy**: Keep previous builds as fallback
5. **Documentation**: Document any custom radar configurations

## API Endpoints

### GET /api/regenerate
Fetches current radar data from Airtable.

**Response:**
```json
{
  "success": true,
  "radarIds": ["rec123", "rec456"],
  "radars": [...],
  "count": 2
}
```

### POST /api/regenerate
Same as GET, but can be used for webhook triggers.

## Environment Variables

Ensure these environment variables are set:

```bash
NEXT_PUBLIC_AIRTABLE_API_KEY=your_api_key
NEXT_PUBLIC_AIRTABLE_BASE_ID=your_base_id
``` 