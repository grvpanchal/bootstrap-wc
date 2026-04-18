# @bootstrap-wc/cli

Command-line tool for adding [Bootstrap Web Components](https://bootstrap-wc.dev) to your project by **copying the TypeScript source** — shadcn-style.

```sh
# one-shot (no install)
npx @bootstrap-wc/cli init
npx @bootstrap-wc/cli add button modal

# or as a dev dep
npm install -D @bootstrap-wc/cli
npx bwc add input form-check
```

## Commands

| Command | Description |
| --- | --- |
| `bwc init` | Create `bwc.json` in the current directory. |
| `bwc add [names...]` | Copy one or more components + their registry deps. Omit names for an interactive picker. |
| `bwc list` | List every available component grouped by category. |
| `bwc diff <name>` | Show drift between a local copy and the upstream registry. |

## `bwc.json`

```json
{
  "$schema": "https://bootstrap-wc.dev/schema.json",
  "componentsDir": "src/components/ui",
  "alias": "@/components/ui",
  "typescript": true,
  "registryUrl": "https://bootstrap-wc.dev/r"
}
```

Point the CLI at a local dev registry during development:

```sh
BWC_REGISTRY_URL=file:///path/to/apps/docs/public/r bwc add button
```
