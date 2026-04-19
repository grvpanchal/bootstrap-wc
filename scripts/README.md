# scripts/

Reusable tooling for the repo.

## `compare-bootstrap.mjs`

Snapshots a `<bs-*>` component's current rendering and diffs it against the
equivalent Bootstrap 5.3 example on getbootstrap.com — structural HTML,
host classes, and a PNG screenshot of each side.

### Usage

    # one component
    node scripts/compare-bootstrap.mjs button-group

    # several
    node scripts/compare-bootstrap.mjs accordion alert card

    # everything in scripts/component-map.json
    node scripts/compare-bootstrap.mjs --all

    # via npm script
    npm run audit:component -- button-group

Starts `astro preview` automatically if nothing is listening on
`http://127.0.0.1:4321/`. Writes to `.audit/<component>/` (gitignored):

- `bwc.png` / `bootstrap.png` — cropped screenshots
- `bwc.html` / `bootstrap.html` — the rendered tree on each side
- `report.md` — host classes seen, Bootstrap classes expected, the delta

### Extending

Add a component by appending to `component-map.json`:

    {
      "<name>": {
        "bwcUrl":      "/components/<name>/",
        "bwcSelector": "bs-<name>",
        "bsUrl":       "/components/<name>/",
        "bsSelector":  ".bd-example .<class>:first-of-type",
        "notes":       "(optional gotcha for the auditor)"
      }
    }

Pick a `bsSelector` that scopes tightly to the first example inside
`.bd-example`, so Bootstrap's navbar / footer chrome isn't captured.

### Agent

For Claude Code users: the `.claude/agents/bootstrap-component-auditor.md`
agent wraps this script into a full audit → fix → re-verify loop. Invoke it
with:

    /agents → bootstrap-component-auditor
