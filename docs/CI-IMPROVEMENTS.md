# CI Improvements — Follow-up Backlog

Items here require permissions or scope that an automated audit pass cannot
land safely. Track them as follow-up PRs.

## D.11 — actionlint for GitHub Actions workflows

**Status:** deferred (not blocking)

GitHub Actions YAML in `.github/workflows/` is currently not linted. A
broken-syntax push only surfaces once the workflow is actually triggered,
which is slow and confusing.

[`actionlint`](https://github.com/rhysd/actionlint) is the standard static
checker for these files: it parses each workflow, validates expression
syntax (`${{ ... }}`), checks `if:` conditions, validates `uses:` action
references, and runs `shellcheck` on every `run:` block.

### Why deferred

The fix requires creating `.github/workflows/lint.yml` with content like:

```yaml
name: Lint workflows
on:
  pull_request:
    paths: ['.github/workflows/**']
  push:
    branches: [main]
    paths: ['.github/workflows/**']
jobs:
  actionlint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: rhysd/actionlint@v1
```

Adding or modifying files under `.github/workflows/` needs a token with the
`workflow` scope (PAT or fine-grained equivalent). The audit pass that
spawned this backlog item did not have that scope, so the workflow file
itself must be added through a separate PR from a maintainer.

### Suggested follow-up PR

1. Create the workflow above as `.github/workflows/lint.yml`.
2. Pin `rhysd/actionlint` to a specific tag (audit the action source first).
3. (Optional) Add a pre-commit hook that runs `actionlint` locally — install
   via `brew install actionlint` / `go install github.com/rhysd/actionlint/cmd/actionlint@latest`
   and gate it on staged `*.yml` files under `.github/workflows/`.

### Acceptance criteria

- A PR that introduces a YAML syntax error or a typo'd `uses:` reference
  fails the new `Lint workflows` check.
- Existing workflows pass with no warnings (fix any pre-existing findings as
  part of the same PR or a follow-up).
