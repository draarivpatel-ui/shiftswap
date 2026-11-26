# ShiftSwap

ShiftSwap is an offline, printable, phone-free shift-swap board for small retail and food teams that do not use scheduling software.

Built Nov 2026 for LaunchPad Hacks.

## What it does

A manager can publish shifts for a week with a day, start time, end time, role, headcount and initial assignees. Staff use the board to propose a direct one-for-one trade between two assigned shifts. Before anything changes, ShiftSwap evaluates both workers against four named hard constraints. A passing trade can be accepted and republished. A failing trade stays unpublished and the interface names the exact rule, worker, measured value and threshold behind the rejection.

The accepted week is revisioned and turned into a clean print payload. The print view hides the screen controls and produces a black-and-white board that can be posted in the shop.

## Rule table

| Code | Rule | Threshold | What a rejection explains |
| --- | --- | --- | --- |
| R1 | Rest gap | 10 hours minimum | The worker, the adjacent shifts and the measured gap |
| R2 | Weekly hours | 40 hours maximum | The worker, total scheduled hours after the trade and the ceiling |
| R3 | Role match | Exact approved role | The worker and each assigned role they are not approved for |
| R4 | Double booking | 0 overlapping minutes | The worker, the overlapping shifts and the overlap size |

Every rule is visible in the product's policy panel. The same policy object is used by the browser interface, the print payload and the Node tests.

## Run it

No package install is needed. There are no runtime dependencies.

```sh
node scripts/serve.mjs
```

Then open the printed local URL. Any static file server can serve the same directory. The app also registers a small service worker when served over HTTP, so the shell can load again without a network after the first visit. Board data stays in local storage on the same browser.

## Test it

Requires Node 22 or newer.

```sh
node --test tests/*.test.mjs
```

Current suite result is 40 test cases with 150 deterministic assertion statements. Coverage includes pass, fail and boundary cases for each constraint, trade validation, malformed input, schedule diff application, republishing, print payload generation and new-shift publication.

## Screenshots and video

The screenshots in `assets/screenshots/` are real 1440 by 900 headless-Chrome captures produced by `scripts/capture-screenshots.mjs`. The narrated demo is committed at `video/demo.mp4` and was recorded from the real local app.

## Honest limits

- Trades are direct one-for-one exchanges between two assigned shifts. There is no open-shift pickup workflow yet.
- There are no payroll or export integrations. The printable board is an operational schedule, not payroll evidence.
- The policy thresholds are fixed in the shipped policy object. A real workplace would need review before relying on them as labor-law compliance.
- Data is local to one browser. There is no multi-user concurrency, account system, audit log or manager approval identity.
- Staff names and shifts in the seed week are fictional sample data. The prototype does not yet include a roster editor.
- The board validates the rules shown in the policy panel. It does not infer overtime, minor-work restrictions, sick leave, breaks or union rules.
- A week holds one local schedule. There is no multi-location or multi-week comparison view.

## Project structure

| Path | Purpose |
| --- | --- |
| `index.html` | Static app shell |
| `styles.css` | Screen and print design |
| `js/core.js` | Board model, validation rules, diffs, republishing and print payload |
| `js/app.js` | Browser interface and local persistence |
| `tests/` | Node test suite |
| `scripts/serve.mjs` | Dependency-free local static server |
| `scripts/capture-screenshots.mjs` | Headless-Chrome screenshot capture |
| `scripts/verify-demo-steps.mjs` | Real-browser replay check for the demo steps |
| `assets/fonts/` | Self-hosted IBM Plex fonts under the SIL Open Font License |
| `video/` | Narration script, recording steps and finished demo video |
| `DEVPOST.md` | Paste-ready submission copy |

## AI disclosure

AI assistance was used for implementation, debugging, test design, documentation and demo-production scripting during the hackathon window. The validation behavior was checked by the deterministic Node test suite, and the screenshots and video were captured from the running local app. The demo narration was synthesized locally. No AI output is accepted by the app as scheduling authority; accepted trades come only from the deterministic rules in `js/core.js`.
