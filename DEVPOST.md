# ShiftSwap Devpost copy

Paste each section into the matching Devpost field. The copy only claims what this repository demonstrates.

- Demo video file `video/demo.mp4` in this repository
- Live demo https://aariv.me/shiftswap/
- Source https://github.com/draarivpatel-ui/shiftswap

## Inspiration

Small retail and food teams often run the week from a paper sheet, a wall calendar or a group text. When two people want to trade shifts, the manager has to remember who is trained for each role, who is already working, who is close to too many hours and who had enough rest. That reasoning usually lives in someone's head, so a mistake is hard to inspect after the board has been rewritten.

ShiftSwap started with a narrower question. What if the paper board itself explained why a swap was safe or unsafe before anyone erased and rewrote the week?

## Built during the hackathon window

ShiftSwap was implemented from an empty project folder during the LaunchPad Hacks submission window in late November 2026. No ShiftSwap application code, validation engine, seed schedule, screenshots, narration script, video steps or submission copy pre-existed this entry. The only reused material is openly licensed font files, the standard MIT license text, local media tooling used to capture and narrate the demo, and the ordinary browser and runtime tools used to build and test the project. The working prototype, tests, documentation and demo assets were produced for this hackathon entry during the window.

## What it does

ShiftSwap is a printable, phone-free shift-swap board for a small retail or food team. It runs as a static offline page with no accounts and no runtime dependencies.

A manager can publish a shift with a day, start and end time, role, headcount and initial assignees. A worker can offer one assigned shift and choose another worker's assigned shift in return. ShiftSwap then simulates that direct trade before changing the board.

The validator checks four hard rules for both workers. It checks the rest gap, the weekly-hours ceiling, exact role approval and double booking. A passing trade can be accepted and republished as a new board revision. A failing trade is rejected with the exact rule, worker, measured value and threshold. The updated week can then be printed as a clean black-and-white board without the screen controls.

The sample seed week is fictional and ships with the app so the workflow can be tried immediately.

## How we built it

The app is dependency-free HTML, CSS and JavaScript modules. `js/core.js` holds the deterministic board model, validation rules, schedule diff logic, republishing logic and print payload generation. `js/app.js` is the browser interface over that same core. Because the rules are ordinary JavaScript rather than hidden application state, the exact same logic is exercised in Node tests and in the browser.

The validation engine treats a proposed trade as a temporary schedule diff. It unassigns both original shifts, assigns the incoming shifts, evaluates the resulting week for both workers and reports every named rule with a pass or fail result. Nothing is republished unless all four hard rules pass.

The test suite uses Node's built-in runner. It has 35 deterministic test cases with 143 assertion statements. The tests cover pass, fail and boundary cases for every rule, malformed trades, malformed board data, assignment diffs, non-mutating trade simulation, republishing, print output and validation of newly published shifts.

The demo assets were produced locally. Three screenshots were captured at 1440 by 900 in headless Chrome. The narration was synthesized locally, and the mp4 was recorded from the real running app at 30 frames per second.

## Challenges

The main design challenge was making validation legible rather than merely correct. A simple yes or no answer would not help a manager understand a rejected trade. Each rule therefore returns a structured result with the worker, measurement, threshold and exact shift names behind the decision.

Boundary behavior also needed care. End-to-start shifts are not double booked, while a one-minute overlap is. Exactly ten hours of rest passes the sample rest rule, while nine hours and fifty-nine minutes does not. Exactly forty weekly hours passes the sample hours ceiling. Those boundary cases are tested directly.

Printing was a separate product surface rather than a stylesheet afterthought. The screen app generates a deterministic print payload and uses it to build a clean paper board. This keeps the printed output aligned with the validated state instead of depending on whichever buttons happened to be visible.

## Accomplishments

- Built a working offline shift-swap prototype with no accounts and no runtime dependencies.
- Made every hard constraint visible in a policy panel with named rules and thresholds.
- Implemented exact failure explanations for both sides of a proposed trade.
- Added manager-side publication of new shifts with the same rule validation.
- Added deterministic republishing and a clean printable weekly board.
- Built a 35-case Node test suite with 143 deterministic assertion statements.
- Captured real browser screenshots and produced a narrated local demo video.

## What we learned

The important product feature was not the swap form. It was the inspectable reasoning behind the decision. Writing the validator as a separate deterministic core made the interface simpler and made the app much easier to test honestly.

Boundary cases also showed how easy it is for scheduling logic to look correct while being wrong. A shift that ends exactly when another begins is different from a one-minute overlap, and an overnight shift changes how rest time must be measured. Explicit tests were necessary for those details.

## What's next

Useful next steps are open-shift pickup offers, editable policy thresholds, break rules, multi-week views, deletion and correction of published shifts, and an audit trail that records who accepted each revision. A production version would also need workplace-specific legal review, payroll integration decisions and multi-device sync before real teams could rely on it.

## Built with

- HTML
- CSS
- JavaScript modules
- Node.js `node:test`
- Headless Chrome
- FFmpeg
- Local OmniVoice narration synthesis
- IBM Plex fonts under the SIL Open Font License

## AI disclosure

AI coding assistants were used during implementation, debugging, test design, documentation and video-production scripting. The final validation behavior was checked with deterministic automated tests, and the screenshots and video were captured from the real running prototype. Local voice synthesis was used for the demo narration. ShiftSwap itself does not use AI to approve or reject trades.
