# Onboarding Guide

## Branches

- **main**:
    - production
    - all commits redeploy to https://eagle-x-prod.onrender.com/ via Render (will be migrated to https://judgeit.live/ later)
    - has Supabase backend
- **dev**:
    - developer
    - commits are _NOT_ deployed
- **test**:
    - testing
    - all commits redeploy to https://eagle-x.onrender.com/ via Render
    - no Supabase backend? alternatively, may have been deleted
        - may consider bringing one back

## Running locally

Assumes the latest versions of `npm` (or more likely, `node.js`) and their installers (e.g., `Chocolately`, `Docker`).

1. Install and update `npm` packages.

```bash
npm install --allow-remote=all
npm update --allow-remote=all
```

2. Verify there is only a `npm warn deprecated eslint@9.7.0` message (downgraded for `eslint-plugin-react@7.37.5`). If there are any other ones, manually read the output and find a way to migrate to a newer version or different package.
3. Let `npm` automatically fix any vulnerable packages that weren't fixed from the `npm update` before.

```bash
npm audit fix
```

4. Verify there are no vulnerabilities. If there are any, manually read the output and find a fix.
5. Create `.env` as a copy of `.env.example`.

```
VITE_SUPABASE_URL=https://your-project.supabase.co # Project URL
VITE_SUPABASE_ANON_KEY=your-anon-key # Publishable key
VITE_DEBUG_LOGS=false # set to `true` for debug logs
```

6. Modify `.env` to contain the Supabase credentials for your chosen database (production or testing). Never commit these credentials; treat your URL and key like a username and password without two-factor authentication.

7. Optionally, run dev scripts defined in `package.json`.

```bash
npm run format
npm run lint
```

8. Run the local server.

```bash
npm run build
npm run dev
```
