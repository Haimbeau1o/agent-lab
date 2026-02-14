# Quality Gates (Run-Priority / Strict-Green)

## Goals

- Keep pull request checks fast enough for iteration (`Run-Priority`).
- Provide a stricter gate before merge/release (`Strict-Green`).
- Make the current gate level explicit in every PR.

## Gate Matrix

| Gate Level | Trigger | Backend | Frontend | Typical Usage |
| --- | --- | --- | --- | --- |
| `Run-Priority` | Pull request default | `cd agent-lab/backend && npm run gate:run-priority` | `cd agent-lab/frontend && npm run build` | Daily development, quick regression checks |
| `Strict-Green` | Manual escalation / pre-merge final check | `cd agent-lab/backend && npm run gate:strict-green` | `cd agent-lab/frontend && npm run build && npm run lint` | Release candidate and debt-closure verification |

## Backend Commands

- `npm run gate:run-priority`
  - Runs `npm run build`
  - Runs `npm run test:storage` (includes Prisma test DB preparation)
- `npm run gate:strict-green`
  - Runs `npm run gate:run-priority`
  - Runs full `vitest run`

## CI Mapping

- Workflow: `.github/workflows/backend-quality-gates.yml`
- Pull requests run `Run-Priority` automatically.
- `Strict-Green` can run via manual workflow dispatch (`gate=strict-green`) and on push to `main`.

## Escalation Rule

Escalate from `Run-Priority` to `Strict-Green` when any of the following is true:

- Touches core runtime, storage, or registry behavior.
- Fixes historical flaky/failing tests.
- Prepares merge to `main`.
- Requires explicit debt closure sign-off.
