# Playground Deployment Guide

This document explains how to deploy the formatr playground to GitHub Pages.

## Automatic Deployment

The playground is configured to deploy automatically via GitHub Actions when changes are pushed to the `main` branch.

### Workflow File

`.github/workflows/deploy-playground.yml` contains the deployment configuration.

### How It Works

1. On push to `main` (or manual trigger):
   - Checks out the repository
   - Installs dependencies for both root and playground
   - Builds the formatr library
   - Builds the playground
   - Uploads the build artifact
   - Deploys to GitHub Pages

## Enabling GitHub Pages

To enable GitHub Pages for the first time:

1. Go to your repository on GitHub
2. Click **Settings** > **Pages**
3. Under **Source**, select:
   - Source: **GitHub Actions**
4. Save the settings

That's it! The next push to `main` will trigger the deployment.

## Accessing the Playground

Once deployed, the playground will be available at:

```
https://timurmanjosov.github.io/formatr/
```

## Manual Deployment

To manually trigger a deployment:

1. Go to **Actions** tab in GitHub
2. Select **Deploy Playground to GitHub Pages**
3. Click **Run workflow**
4. Select the branch (usually `main`)
5. Click **Run workflow**

## Local Development

### Development Server

```bash
cd playground
npm install
npm run dev
```

Access at: `http://localhost:5173/formatr/`

### Preview Production Build

```bash
cd playground
npm run build
npm run preview
```

Access at: `http://localhost:4173/formatr/`

## Troubleshooting

### Build Fails

- Ensure the root formatr library builds successfully first: `npm run build`
- Check that all dependencies are installed: `npm install` in both root and playground
- Verify Node.js version is 18 or higher

### Monaco Editor Not Loading

- Check browser console for errors
- Ensure Monaco Editor assets are loading from CDN
- Try clearing browser cache

### 404 on Deployment

- Verify the `base` path in `playground/vite.config.ts` matches your repository name
- Ensure GitHub Pages is enabled in repository settings
- Check that the workflow completed successfully in Actions tab

## Configuration

### Base Path

The base path is set in `playground/vite.config.ts`:

```typescript
export default defineConfig({
  plugins: [react()],
  base: '/formatr/', // Must match repository name
})
```

If deploying to a different URL, update this value.

### Workflow Triggers

The workflow triggers on:
- Push to `main` branch with changes in `playground/` or workflow file
- Manual trigger via `workflow_dispatch`

To modify triggers, edit `.github/workflows/deploy-playground.yml`

## Security Notes

- The playground runs entirely in the browser (no backend)
- All template processing happens client-side
- Shareable links encode state in URL parameters
- No user data is sent to any server

## Performance

- Monaco Editor is loaded lazily to reduce initial load time
- Template rendering is debounced (300ms) to avoid excessive re-renders
- Production build is optimized and gzipped (~72KB for JS)
- Template compilation is cached for repeat renders

## License

Same as parent project - see [LICENSE](../LICENSE)
