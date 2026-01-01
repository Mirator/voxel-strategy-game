# GitHub Pages Deployment Fix

## Problem
The GitHub Pages site is currently configured to deploy from the `main` branch root directory (`/`), which only contains a README file. The actual game application is in the `voxel-strategy/` subdirectory and needs to be built with Vite before deployment.

## Solution Implemented
Moved the GitHub Actions workflows from `voxel-strategy/.github/workflows/` to `.github/workflows/` at the repository root so they will be recognized and run by GitHub Actions.

## Required Manual Step
After merging this PR, you need to update the GitHub Pages configuration:

1. Go to: https://github.com/Mirator/voxel-strategy-game/settings/pages
2. Under "Build and deployment" → "Source"
3. Change from **"Deploy from a branch"** to **"GitHub Actions"**
4. Save the changes

## What This Does
Once configured to use GitHub Actions:
- The `deploy.yml` workflow will automatically run on every push to `main`
- It will:
  1. Install dependencies from `voxel-strategy/package.json`
  2. Build the Vite application (`npm run build` in `voxel-strategy/`)
  3. Deploy the built files from `voxel-strategy/dist/` to GitHub Pages
  4. The game will be accessible at https://mirator.github.io/voxel-strategy-game/

## Verification
After changing the settings and the workflow runs:
1. Go to the Actions tab to see the deployment workflow running
2. Visit https://mirator.github.io/voxel-strategy-game/ - you should see the game instead of just the README
