# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static HTML, CSS and JavaScript modules with no runtime dependencies. The implementation brief delegates the detailed structure to the builder while requiring offline operation and Node's built-in test runner.

## Users

Managers and staff in small retail or food teams that do not use scheduling software. The manager publishes a week on one shared local board. Staff use the same board to propose direct shift trades.

## Product Purpose

ShiftSwap makes a phone-free shift-swap board possible. It keeps a printable weekly schedule current while checking every proposed trade before the board is republished.

## Positioning

The differentiating mechanism is inspectable constraint validation. Every hard rule is named, every threshold is visible, and every rejected trade says exactly which rule failed and for whom.

## Operating Context

A small shop or food counter with one computer or printed board, no accounts, no network requirement after the static files are available, and no payroll integration.

## Capabilities and Constraints

- Local sample week included.
- Manager can publish additional shifts.
- Staff can propose a direct one-for-one trade between two assigned shifts.
- Validation covers rest gap, maximum weekly hours, role match and double booking.
- Accepted trades republish the week and refresh the print payload.
- Data stays in the browser's local storage.
- No payroll, export integrations, accounts, notifications or multi-location support.

## Brand Commitments

The name is ShiftSwap. The product voice is plain, exact and operational.

## Evidence on Hand

The sample seed week is fictional and ships in `js/core.js`. Screenshots, tests and the demo video are generated from the real running static app.

## Product Principles

1. The printed board must remain understandable without the app.
2. A rule is useful only when its threshold and failure reason are visible.
3. Local operation beats account creation for this setting.
4. A small truthful feature set is better than a broad claim.

## Accessibility & Inclusion

The board is keyboard operable, uses visible focus states, semantic controls, readable contrast and a print layout that does not depend on color.
