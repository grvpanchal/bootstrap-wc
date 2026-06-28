# Releasing

Releases are driven by [changesets](https://github.com/changesets/changesets)
and the `.github/workflows/release.yml` action. Day-to-day, the flow is fully
automatic:

1. A PR lands on `master` carrying one or more `.changeset/*.md` files.
2. The Release workflow opens (or updates) a "Version Packages" PR that
   bumps every affected `package.json`'s version and rewrites the
   `CHANGELOG.md` files.
3. When that PR is merged, the workflow re-fires and `changeset publish`
   pushes the new versions to npm.

Nothing else to do — assuming the npm auth token is valid.

## When publish fails with E404 on every package

That's the symptom of an expired or revoked `NPM_TOKEN`. npm uses HTTP 404
to mean "your token can't publish to that package name" (it hides
existence to avoid leaking metadata to unauthorized users), so a symmetric
404 across every package in the publish set is unmistakeable: the secret
is the problem, not the code.

The release workflow now runs `npm whoami` before `changeset publish`
when a changeset is queued, so the next time a token expires the run
fails fast with a clear error in the workflow logs instead of buried
inside the changesets output.

## Rotating `NPM_TOKEN`

1. **Sign in at https://www.npmjs.com** as the maintainer of the
   `@bootstrap-wc` scope.

2. **Generate a new token:** `Settings → Access Tokens → Generate New
   Token → Granular Access Token`.

   - Expiration: ≥ 90 days
   - Permissions: `Read and write`
   - Packages: scoped — `@bootstrap-wc/*` (or list each package)
   - Allowed organizations: leave blank if the scope is owned by you
     directly

   Save the token value — you only see it once.

3. **Update the GitHub secret:**

   `https://github.com/grvpanchal/bootstrap-wc/settings/secrets/actions`
   → `NPM_TOKEN` → Update.

4. **Re-run the failed Release workflow run:** Actions tab → the failed
   run → "Re-run failed jobs". The new token gets injected into the
   `NODE_AUTH_TOKEN` env var and `changeset publish` picks up where it
   left off.

## Verifying the token locally

```sh
NPM_TOKEN="$(pass show npm/bootstrap-wc)" \
  NODE_AUTH_TOKEN="$NPM_TOKEN" \
  npm whoami --registry https://registry.npmjs.org
```

Should print your npm username. If it doesn't, the token is wrong.

## Longer-term: npm trusted publishing (OIDC)

Tokens expire. Trusted publishing via OIDC removes the long-lived secret
entirely and authenticates each publish through GitHub Actions' OIDC
identity instead. The workflow already grants `id-token: write`
permission — the missing piece is per-package configuration on
npmjs.com:

`https://www.npmjs.com/package/<pkg>/access`
→ "Trusted publisher" → GitHub Actions → repo
`grvpanchal/bootstrap-wc`, workflow `.github/workflows/release.yml`,
environment (leave blank).

Once enabled per package, `npm publish` from this workflow stops needing
`NPM_TOKEN`, and provenance is attached automatically.

Cost: it's manual per-package setup, but there's roughly 27 packages so
this is a one-day investment that's permanent.
