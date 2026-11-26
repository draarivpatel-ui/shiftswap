# Design

## Direction

ShiftSwap uses a print-first operations-board visual world. The screen interface should feel like a precise paper schedule lifted into a tool, with warm paper surfaces, dark ink text, restrained green approval, amber attention and red failure.

## Mode

Operate. The user is completing scheduling work, so scanability, familiar controls, compact data and explicit states outrank decoration.

## Typography

IBM Plex Sans is the interface family, self-hosted under the SIL Open Font License. IBM Plex Mono is reserved for revision, time and machine-like print payload details.

## Color

- Paper background `#f2eee4`
- Panel paper `#fffdf7`
- Ink `#17231f`
- Muted ink `#52615b`
- Deep green `#0b6654`
- Amber `#9a6200`
- Red `#a9362c`
- Cool line `#d8d2c4`

## Composition

The app uses a dark top bar, a wide board column and a stable right rail. The right rail holds the swap desk, policy panel and print payload. Shift cards sit inside day rows so the weekly structure stays visible. The printed output is black ink on white paper and hides every screen-only control.

## Interaction Rules

No modal is used for the trade flow. Validation appears inline beside the controls that caused it. Accepted and rejected states use both color and text. Buttons have hover, focus, active and disabled states. Motion is limited to short state feedback.

## Copy Rules

No eyebrow or kicker text above titles. No tagline or helper line beneath the product title. Rule names and thresholds are literal. Error messages name the worker, rule, measured value and threshold when available.
