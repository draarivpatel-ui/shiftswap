import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assignmentsForWorker,
  createSampleBoard,
  defaultPolicy,
  evaluateBoardPolicy,
  internals,
  policyRules,
  shiftInterval,
  timeToMinutes,
  validateTrade
} from '../js/core.js';

function workerRule(board, workerId, ruleId, policy = defaultPolicy()) {
  return internals.workerEvaluations(board, workerId, policy).find((result) => result.ruleId === ruleId);
}

function fixtureBoard(shifts, staff = [
  { id: 'ada', name: 'Ada Lane', roles: ['counter', 'kitchen'] },
  { id: 'ben', name: 'Ben Park', roles: ['counter'] }
]) {
  return {
    schema: 'shiftswap-board-v1',
    weekStart: '2026-12-07',
    revision: 1,
    staff,
    shifts
  };
}

function shift(id, date, start, end, role, assignments, headcount = 1) {
  return { id, date, start, end, role, headcount, assignments };
}

test('time parsing handles valid times, rejects malformed times, and measures overnight shifts', () => {
  assert.equal(timeToMinutes('00:00'), 0);
  assert.equal(timeToMinutes('06:30'), 390);
  assert.equal(timeToMinutes('23:59'), 1439);
  assert.ok(Number.isNaN(timeToMinutes('24:00')));
  assert.ok(Number.isNaN(timeToMinutes('9:15')));
  assert.ok(Number.isNaN(timeToMinutes(90)));
  const overnight = shiftInterval(shift('overnight', '2026-12-07', '22:00', '06:00', 'counter', ['ada']));
  assert.equal(overnight.duration, 480);
  assert.equal(overnight.end - overnight.start, 480);
});

test('sample week is valid, policy clean, and exposes four named rules in stable order', () => {
  const board = createSampleBoard();
  assert.equal(evaluateBoardPolicy(board).length, 0);
  assert.equal(board.shifts.length, 21);
  assert.equal(board.staff.length, 9);
  assert.deepEqual(policyRules().map((rule) => rule.id), ['rest-gap', 'max-weekly-hours', 'role-match', 'double-booking']);
  assert.deepEqual(policyRules().map((rule) => rule.code), ['R1', 'R2', 'R3', 'R4']);
  assert.equal(policyRules()[0].thresholdLabel, '10 hours minimum');
  assert.equal(policyRules()[1].thresholdLabel, '40 hours maximum');
});

test('rest gap passes with a comfortable gap', () => {
  const board = fixtureBoard([
    shift('mon', '2026-12-07', '06:00', '14:00', 'counter', ['ada']),
    shift('tue', '2026-12-08', '06:00', '14:00', 'counter', ['ada'])
  ]);
  const result = workerRule(board, 'ada', 'rest-gap');
  assert.equal(result.passed, true);
  assert.equal(result.measuredMinutes, 16 * 60);
  assert.match(result.message, /at least 10 hours/);
});

test('rest gap fails below the threshold and names the measured gap', () => {
  const board = fixtureBoard([
    shift('mon-close', '2026-12-07', '14:00', '22:00', 'counter', ['ada']),
    shift('tue-open', '2026-12-08', '06:00', '14:00', 'counter', ['ada'])
  ]);
  const result = workerRule(board, 'ada', 'rest-gap');
  assert.equal(result.passed, false);
  assert.equal(result.measuredMinutes, 8 * 60);
  assert.match(result.message, /8 hours/);
  assert.match(result.message, /requires 10 hours/);
});

test('rest gap border exactly at the threshold passes, including after an overnight shift', () => {
  const board = fixtureBoard([
    shift('mon-night', '2026-12-07', '22:00', '06:00', 'counter', ['ada']),
    shift('tue-late', '2026-12-08', '16:00', '22:00', 'counter', ['ada'])
  ]);
  const result = workerRule(board, 'ada', 'rest-gap');
  assert.equal(result.passed, true);
  assert.equal(result.measuredMinutes, 10 * 60);
});

test('rest gap one minute below the threshold fails at exactly 599 minutes', () => {
  const board = fixtureBoard([
    shift('mon-close', '2026-12-07', '14:00', '22:00', 'counter', ['ada']),
    shift('tue-open', '2026-12-08', '07:59', '15:59', 'counter', ['ada'])
  ]);
  const result = workerRule(board, 'ada', 'rest-gap');
  assert.equal(result.passed, false);
  assert.equal(result.measuredMinutes, 599);
  assert.match(result.message, /requires 10 hours/);
});

test('weekly hours passes below the ceiling', () => {
  const board = fixtureBoard([
    shift('d1', '2026-12-07', '06:00', '14:00', 'counter', ['ada']),
    shift('d2', '2026-12-08', '06:00', '14:00', 'counter', ['ada']),
    shift('d3', '2026-12-09', '06:00', '14:00', 'counter', ['ada']),
    shift('d4', '2026-12-10', '06:00', '14:00', 'counter', ['ada'])
  ]);
  const result = workerRule(board, 'ada', 'max-weekly-hours');
  assert.equal(result.passed, true);
  assert.equal(result.measuredMinutes, 32 * 60);
  assert.match(result.message, /32 hours of the 40 hours/);
});

test('weekly hours border exactly at the ceiling passes', () => {
  const board = fixtureBoard([
    shift('d1', '2026-12-07', '06:00', '14:00', 'counter', ['ada']),
    shift('d2', '2026-12-08', '06:00', '14:00', 'counter', ['ada']),
    shift('d3', '2026-12-09', '06:00', '14:00', 'counter', ['ada']),
    shift('d4', '2026-12-10', '06:00', '14:00', 'counter', ['ada']),
    shift('d5', '2026-12-11', '06:00', '14:00', 'counter', ['ada'])
  ]);
  const result = workerRule(board, 'ada', 'max-weekly-hours');
  assert.equal(result.passed, true);
  assert.equal(result.measuredMinutes, 40 * 60);
});

test('weekly hours fails above the ceiling', () => {
  const board = fixtureBoard([
    shift('d1', '2026-12-07', '06:00', '14:00', 'counter', ['ada']),
    shift('d2', '2026-12-08', '06:00', '14:00', 'counter', ['ada']),
    shift('d3', '2026-12-09', '06:00', '14:00', 'counter', ['ada']),
    shift('d4', '2026-12-10', '06:00', '14:00', 'counter', ['ada']),
    shift('d5', '2026-12-11', '06:00', '14:30', 'counter', ['ada'])
  ]);
  const result = workerRule(board, 'ada', 'max-weekly-hours');
  assert.equal(result.passed, false);
  assert.equal(result.measuredMinutes, 40.5 * 60);
  assert.match(result.message, /40\.5 hours/);
  assert.match(result.message, /above the 40 hours/);
});

test('role match passes for an exact approved role', () => {
  const board = fixtureBoard([
    shift('counter', '2026-12-07', '06:00', '14:00', 'counter', ['ada'])
  ]);
  const result = workerRule(board, 'ada', 'role-match');
  assert.equal(result.passed, true);
  assert.match(result.message, /approved for every assigned role/);
});

test('role match fails for a missing role and exact case mismatch is not approved', () => {
  const board = fixtureBoard([
    shift('prep', '2026-12-07', '06:00', '14:00', 'prep', ['ada']),
    shift('case', '2026-12-08', '06:00', '14:00', 'Counter', ['ada'])
  ]);
  const result = workerRule(board, 'ada', 'role-match');
  assert.equal(result.passed, false);
  assert.match(result.message, /prep/);
  assert.match(result.message, /Counter/);
});

test('double booking passes when shifts are separated', () => {
  const board = fixtureBoard([
    shift('first', '2026-12-07', '06:00', '10:00', 'counter', ['ada']),
    shift('second', '2026-12-07', '11:00', '14:00', 'counter', ['ada'])
  ]);
  const result = workerRule(board, 'ada', 'double-booking');
  assert.equal(result.passed, true);
  assert.equal(result.measuredMinutes, 0);
});

test('double booking border end touching start passes', () => {
  const board = fixtureBoard([
    shift('first', '2026-12-07', '06:00', '10:00', 'counter', ['ada']),
    shift('second', '2026-12-07', '10:00', '14:00', 'counter', ['ada'])
  ]);
  const result = workerRule(board, 'ada', 'double-booking');
  assert.equal(result.passed, true);
  assert.equal(result.measuredMinutes, 0);
});

test('double booking fails on a one minute overlap', () => {
  const board = fixtureBoard([
    shift('first', '2026-12-07', '06:00', '10:01', 'counter', ['ada']),
    shift('second', '2026-12-07', '10:00', '14:00', 'counter', ['ada'])
  ]);
  const result = workerRule(board, 'ada', 'double-booking');
  assert.equal(result.passed, false);
  assert.equal(result.measuredMinutes, 1);
  assert.match(result.message, /1 minute/);
});

test('the sample passing trade passes every hard rule', () => {
  const result = validateTrade(createSampleBoard(), {
    sourceShiftId: 'wed-close',
    sourceWorkerId: 'maya',
    counterWorkerId: 'alex',
    counterShiftId: 'thu-open'
  });
  assert.equal(result.ok, true);
  assert.deepEqual(result.failingRules, []);
  assert.equal(result.ruleResults.length, 4);
  assert.ok(result.ruleResults.every((rule) => rule.passed));
  assert.equal(result.diff.length, 4);
  assert.equal(assignmentsForWorker(result.resultingBoard, 'maya').some((item) => item.id === 'thu-open'), true);
});

test('the sample rest-gap failure names only the rest-gap rule', () => {
  const result = validateTrade(createSampleBoard(), {
    sourceShiftId: 'mon-open',
    sourceWorkerId: 'noor',
    counterWorkerId: 'jamie',
    counterShiftId: 'wed-open'
  });
  assert.equal(result.ok, false);
  assert.deepEqual(result.failingRules, ['rest-gap']);
  const rest = result.ruleResults.find((rule) => rule.ruleId === 'rest-gap');
  assert.equal(rest.passed, false);
  assert.match(rest.message, /Noor Ali/);
  assert.match(rest.message, /8 hours/);
  assert.match(rest.message, /10 hours/);
});

test('a role mismatch rejects both sides when neither worker is approved', () => {
  const result = validateTrade(createSampleBoard(), {
    sourceShiftId: 'mon-open',
    sourceWorkerId: 'noor',
    counterWorkerId: 'luis',
    counterShiftId: 'mon-kitchen'
  });
  assert.equal(result.ok, false);
  assert.ok(result.failingRules.includes('role-match'));
  const role = result.ruleResults.find((rule) => rule.ruleId === 'role-match');
  assert.match(role.message, /Noor Ali/);
  assert.match(role.message, /Luis Rivera/);
  assert.match(role.message, /kitchen/);
  assert.match(role.message, /counter/);
});
