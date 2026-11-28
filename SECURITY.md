# Security policy

## Reporting a vulnerability

Use the private GitHub Security Advisory form at [Report a vulnerability](https://github.com/draarivpatel-ui/shiftswap/security/advisories/new). Do not open a public issue, pull request or discussion with exploit details.

Never include a live secret, token, cookie, private key, victim hostname or proprietary payload in a report. Use synthetic values and redacted transcripts.

## Supported versions

| Version | Status |
| --- | --- |
| latest `main` | Supported |

Security fixes are applied to the latest state of the default branch.

## Scope

This policy covers the static ShiftSwap browser application, including schedule validation, trade application and republishing, local persistence, the service worker, print payload generation, local assets and test tooling.

In scope:

- A cross-site scripting or HTML injection path through worker names, shift fields, validation messages, print output or imported application data.
- A prototype-pollution, object-validation or schedule-diff flaw that bypasses constraint validation or corrupts another user's board state.
- A service worker or cache-control flaw that serves attacker-controlled application code across an update.
- A print payload escaping flaw that makes generated output execute active content when opened or printed.
- A local persistence flaw that crosses origin boundaries or corrupts another user's saved board.

Out of scope:

- Browser vulnerabilities, operating system compromise or physical access to the machine.
- Damage caused by modified copies of the static application that do not come from this repository.
- Labor-law, payroll or workplace-policy correctness, except for a specific failure of the validation rules documented in the repository.

## Coordinated disclosure

- Acknowledgment: within 3 business days.
- Initial triage: within 14 calendar days.
- Fix or mitigation target: within 90 calendar days for confirmed reports.
- Coordinated public disclosure: up to 90 days by default, adjusted by mutual agreement when exploitation or user risk requires a different date.
