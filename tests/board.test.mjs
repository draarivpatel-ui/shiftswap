import test from 'node:test';
import assert from 'node:assert/strict';
import {
  acceptTrade,
  applyScheduleDiff,
  buildPrintPayload,
  cloneBoard,
  createSampleBoard,
  diffSchedules,
  publishShift,
  republishBoard,
  simulateTrade,
  tradeDiff,
  validateBoard,
  validateTrade
} from '../js/core.js';

const passingTrade = {
  sourceShiftId: 'wed-close',
  sourceWorkerId: 'maya',
  counterWorkerId: 'alex',
  counterShiftId: 'thu-open'
};

test('board validation accepts the shipped seed week', () => {
  const result = validateBoard(createSampleBoard());
  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
});

test('board validation rejects malformed dates, times, headcounts and unknown assignments', () => {
  const board = createSampleBoard();
  board.shifts = [{
    id: 'broken',
    date: '2026-02-31',
    start: '25:00',
    end: '09:00',
    role: 'counter',
    headcount: 0,
    assignments: ['nobody']
  }];
  const result = validateBoard(board);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes('invalid date')));
  assert.ok(result.errors.some((error) => error.includes('invalid start time')));
  assert.ok(result.errors.some((error) => error.includes('headcount')));
  assert.ok(result.errors.some((error) => error.includes('unknown staff')));

  const outside = createSampleBoard();
  outside.shifts[0].date = '2026-12-20';
  const outsideResult = validateBoard(outside);
  assert.equal(outsideResult.ok, false);
  assert.ok(outsideResult.errors.some((error) => error.includes('outside the board week')));
});

test('board validation rejects duplicate shift ids, duplicate workers and overfilled shifts', () => {
  const board = createSampleBoard();
  board.shifts[1].id = board.shifts[0].id;
  board.shifts[0].assignments.push('maya', 'priya');
  const result = validateBoard(board);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes('duplicated')));
  assert.ok(result.errors.some((error) => error.includes('twice')));
  assert.ok(result.errors.some((error) => error.includes('more assignments')));
});

test('malformed trades require all four references', () => {
  const result = validateTrade(createSampleBoard(), {
    sourceShiftId: 'wed-close',
    sourceWorkerId: 'maya'
  });
  assert.equal(result.ok, false);
  assert.ok(result.errors.includes('counterShiftId is required'));
  assert.ok(result.errors.includes('counterWorkerId is required'));
  assert.equal(result.ruleResults.length, 0);
});

test('malformed trades reject unknown records, self-trades and workers not on the named shifts', () => {
  const board = createSampleBoard();
  const unknown = validateTrade(board, { sourceShiftId: 'missing', sourceWorkerId: 'maya', counterWorkerId: 'alex', counterShiftId: 'thu-open' });
  assert.ok(unknown.errors.some((error) => error.includes('unknown source shift')));

  const selfTrade = validateTrade(board, { sourceShiftId: 'wed-close', sourceWorkerId: 'maya', counterWorkerId: 'maya', counterShiftId: 'thu-open' });
  assert.ok(selfTrade.errors.some((error) => error.includes('cannot trade with themself')));

  const notAssigned = validateTrade(board, { sourceShiftId: 'wed-close', sourceWorkerId: 'alex', counterWorkerId: 'maya', counterShiftId: 'thu-open' });
  assert.ok(notAssigned.errors.some((error) => error.includes('is not assigned')));

  const sameShift = validateTrade(board, { sourceShiftId: 'mon-open', sourceWorkerId: 'maya', counterWorkerId: 'noor', counterShiftId: 'mon-open' });
  assert.ok(sameShift.errors.some((error) => error.includes('must be different')));
});

test('simulateTrade swaps the two assignments without mutating the input board', () => {
  const board = createSampleBoard();
  const before = cloneBoard(board);
  const result = simulateTrade(board, passingTrade);
  assert.equal(result.ok, true);
  assert.deepEqual(board, before);
  assert.deepEqual(result.board.shifts.find((shift) => shift.id === 'wed-close').assignments, ['alex']);
  assert.deepEqual(result.board.shifts.find((shift) => shift.id === 'thu-open').assignments, ['maya', 'jamie']);
  assert.deepEqual(result.diff, tradeDiff(passingTrade));
});

test('applyScheduleDiff applies assign and unassign operations atomically', () => {
  const board = createSampleBoard();
  const result = applyScheduleDiff(board, tradeDiff(passingTrade));
  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.board.shifts.find((shift) => shift.id === 'wed-close').assignments, ['alex']);
  assert.equal(board.shifts.find((shift) => shift.id === 'wed-close').assignments[0], 'maya');
});

test('applyScheduleDiff rejects bad operations, duplicate assignment and missing unassignment', () => {
  const board = createSampleBoard();
  const badOp = applyScheduleDiff(board, [{ op: 'move', shiftId: 'wed-close', workerId: 'maya' }]);
  assert.equal(badOp.ok, false);
  assert.ok(badOp.errors[0].includes('assign or unassign'));

  const duplicate = applyScheduleDiff(board, [{ op: 'assign', shiftId: 'wed-close', workerId: 'maya' }]);
  assert.equal(duplicate.ok, false);
  assert.ok(duplicate.errors[0].includes('twice'));

  const missing = applyScheduleDiff(board, [{ op: 'unassign', shiftId: 'wed-close', workerId: 'alex' }]);
  assert.equal(missing.ok, false);
  assert.ok(missing.errors[0].includes('not on the shift'));
});

test('diffSchedules reports exactly the assignment changes from a trade', () => {
  const board = createSampleBoard();
  const simulated = simulateTrade(board, passingTrade).board;
  const diff = diffSchedules(board, simulated);
  const keys = diff.map((entry) => `${entry.op}:${entry.shiftId}:${entry.workerId}`).sort();
  assert.deepEqual(keys, [
    'assign:thu-open:maya',
    'assign:wed-close:alex',
    'unassign:thu-open:alex',
    'unassign:wed-close:maya'
  ]);
});

test('acceptTrade republishes the board at the next revision', () => {
  const board = createSampleBoard();
  const result = acceptTrade(board, passingTrade);
  assert.equal(result.ok, true);
  assert.equal(result.board.revision, 2);
  assert.equal(board.revision, 1);
  assert.equal(result.validation.ok, true);
  assert.equal(result.board.shifts.find((shift) => shift.id === 'wed-close').assignments[0], 'alex');
});

test('acceptTrade leaves the board unpublished when a rule fails', () => {
  const board = createSampleBoard();
  const result = acceptTrade(board, {
    sourceShiftId: 'mon-open',
    sourceWorkerId: 'noor',
    counterWorkerId: 'jamie',
    counterShiftId: 'wed-open'
  });
  assert.equal(result.ok, false);
  assert.equal(result.board, undefined);
  assert.deepEqual(result.validation.failingRules, ['rest-gap']);
});

test('republishBoard increments only the revision and rejects malformed input', () => {
  const board = createSampleBoard();
  const republished = republishBoard(board);
  assert.equal(republished.revision, 2);
  assert.equal(republished.shifts.length, board.shifts.length);
  assert.notEqual(republished, board);
  assert.throws(() => republishBoard({ schema: 'bad' }), /malformed board/);
});

test('print payload is deterministic and contains rules, revision, rows and readable text', () => {
  const accepted = acceptTrade(createSampleBoard(), passingTrade).board;
  const first = buildPrintPayload(accepted);
  const second = buildPrintPayload(accepted);
  assert.deepEqual(first, second);
  assert.equal(first.revision, 2);
  assert.equal(first.rows.length, 21);
  assert.equal(first.policy.length, 4);
  assert.match(first.text, /ShiftSwap weekly board/);
  assert.match(first.text, /Revision 2/);
  assert.match(first.text, /R1 Rest gap - 10 hours minimum/);
  assert.match(first.text, /R2 Weekly hours - 40 hours maximum/);
  assert.match(first.text, /14:00-22:00 counter 1\/1 covered - Alex Morgan/);
  assert.equal(first.lines.includes(''), true);
});

test('print payload refuses malformed boards instead of printing a confident schedule', () => {
  assert.throws(() => buildPrintPayload({ schema: 'wrong' }), /malformed board/);
});

test('publishShift validates and republishes a compliant new shift', () => {
  const result = publishShift(createSampleBoard(), {
    id: 'sat-deep-clean',
    date: '2026-12-12',
    start: '18:00',
    end: '22:00',
    role: 'counter',
    headcount: 1,
    assignments: ['jamie']
  });
  assert.equal(result.ok, true);
  assert.equal(result.board.revision, 2);
  assert.equal(result.board.shifts.length, 22);
  assert.deepEqual(result.shift.assignments, ['jamie']);
});

test('publishShift rejects malformed fields and unknown assignees', () => {
  const result = publishShift(createSampleBoard(), {
    id: 'broken-shift',
    date: '2026-12-20',
    start: 'bad',
    end: '12:00',
    role: ' ',
    headcount: 0,
    assignments: ['ghost']
  });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes('outside the board week')));
  assert.ok(result.errors.some((error) => error.includes('invalid start time')));
  assert.ok(result.errors.some((error) => error.includes('needs a role')));
  assert.ok(result.errors.some((error) => error.includes('headcount')));
  assert.ok(result.errors.some((error) => error.includes('unknown staff')));
});

test('publishShift rejects non-array and duplicate assignments instead of silently repairing them', () => {
  const nonArray = publishShift(createSampleBoard(), {
    id: 'bad-assignment-shape',
    date: '2026-12-12',
    start: '18:00',
    end: '22:00',
    role: 'counter',
    headcount: 1,
    assignments: 'jamie'
  });
  assert.equal(nonArray.ok, false);
  assert.ok(nonArray.errors.some((error) => error.includes('assignments must be an array')));

  const duplicate = publishShift(createSampleBoard(), {
    id: 'duplicate-assignment',
    date: '2026-12-12',
    start: '18:00',
    end: '22:00',
    role: 'counter',
    headcount: 2,
    assignments: ['jamie', 'jamie']
  });
  assert.equal(duplicate.ok, false);
  assert.ok(duplicate.errors.some((error) => error.includes('twice')));
});

test('publishShift rejects a new assignment that violates role match', () => {
  const result = publishShift(createSampleBoard(), {
    id: 'bad-role-shift',
    date: '2026-12-12',
    start: '18:00',
    end: '22:00',
    role: 'counter',
    headcount: 1,
    assignments: ['luis']
  });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes('R3 Role match')));
  assert.ok(result.errors.some((error) => error.includes('Luis Rivera')));
});
