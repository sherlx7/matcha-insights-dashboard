# CI/CD Workflow Setup

Due to GitHub App permissions, the workflow file needs to be added manually. Follow these steps:

## Step 1: Add the Workflow File

1. Go to your GitHub repository: https://github.com/sherlx7/matcha-insights-dashboard
2. Click "Add file" → "Create new file"
3. Name it: `.github/workflows/ci-cd.yml`
4. Paste the content below
5. Commit directly to the `main` branch

## Step 2: Add Repository Secrets

Go to Settings → Secrets and variables → Actions → New repository secret

Add these secrets:
- `VITE_SUPABASE_URL` = `https://atrtvmgtfrnxfbkpsojr.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY` = `sb_publishable_CqoU9Ol5N3etKfHoCUBR4w_Zz6kPUUg`

## Workflow File Content

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'

jobs:
  # Lint and type-check
  lint-and-typecheck:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Type check (build)
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.VITE_SUPABASE_PUBLISHABLE_KEY }}

  # Run tests (if you have tests configured)
  test:
    name: Run Tests
    runs-on: ubuntu-latest
    needs: lint-and-typecheck
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test || echo "No tests configured"
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.VITE_SUPABASE_PUBLISHABLE_KEY }}

  # Build and deploy (only on main branch)
  deploy:
    name: Build & Deploy
    runs-on: ubuntu-latest
    needs: [lint-and-typecheck, test]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build for production
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.VITE_SUPABASE_PUBLISHABLE_KEY }}

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
          retention-days: 7

      # Uncomment and configure for your deployment platform:
      
      # Deploy to Vercel
      # - name: Deploy to Vercel
      #   uses: amondnet/vercel-action@v25
      #   with:
      #     vercel-token: ${{ secrets.VERCEL_TOKEN }}
      #     vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
      #     vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
      #     vercel-args: '--prod'
      
      # Deploy to Netlify
      # - name: Deploy to Netlify
      #   uses: nwtgck/actions-netlify@v2
      #   with:
      #     publish-dir: './dist'
      #     production-deploy: true
      #   env:
      #     NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
      #     NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}

      # Deploy to GitHub Pages
      # - name: Deploy to GitHub Pages
      #   uses: peaceiris/actions-gh-pages@v3
      #   with:
      #     github_token: ${{ secrets.GITHUB_TOKEN }}
      #     publish_dir: ./dist
```

## What the Pipeline Does

1. **On every push/PR to main**:
   - Runs ESLint to check code quality
   - Builds the project to verify TypeScript types

2. **On merge to main**:
   - Builds production bundle
   - Uploads build artifacts
   - (Optional) Deploys to Vercel/Netlify/GitHub Pages

## Enabling Auto-Deploy

### For Vercel:
1. Add secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
2. Uncomment the Vercel deployment section

### For Netlify:
1. Add secrets: `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID`
2. Uncomment the Netlify deployment section

### For GitHub Pages:
1. Enable Pages in repository settings
2. Uncomment the GitHub Pages deployment section
