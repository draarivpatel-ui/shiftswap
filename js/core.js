const MINUTES_PER_DAY = 24 * 60;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function defaultPolicy() {
  return {
    version: 1,
    restGapHours: 10,
    maxWeeklyHours: 40,
    roleMatch: 'exact approved role',
    doubleBooking: 'zero overlapping minutes'
  };
}

export function policyRules(policy = defaultPolicy()) {
  return [
    {
      id: 'rest-gap',
      code: 'R1',
      name: 'Rest gap',
      thresholdLabel: `${trimNumber(policy.restGapHours)} hours minimum`,
      thresholdValue: policy.restGapHours,
      statement: 'A worker must have enough time between the end of one shift and the start of the next.'
    },
    {
      id: 'max-weekly-hours',
      code: 'R2',
      name: 'Weekly hours',
      thresholdLabel: `${trimNumber(policy.maxWeeklyHours)} hours maximum`,
      thresholdValue: policy.maxWeeklyHours,
      statement: 'A worker must stay at or below the weekly scheduled-hours ceiling after the trade.'
    },
    {
      id: 'role-match',
      code: 'R3',
      name: 'Role match',
      thresholdLabel: policy.roleMatch,
      thresholdValue: policy.roleMatch,
      statement: 'A worker may take only a shift whose role appears in that worker\'s approved roles.'
    },
    {
      id: 'double-booking',
      code: 'R4',
      name: 'Double booking',
      thresholdLabel: '0 overlapping minutes',
      thresholdValue: 0,
      statement: 'A worker may not be assigned to two shifts that overlap in time.'
    }
  ];
}

export function createSampleBoard() {
  return {
    schema: 'shiftswap-board-v1',
    weekStart: '2026-12-07',
    revision: 1,
    staff: [
      { id: 'maya', name: 'Maya Chen', roles: ['counter', 'barista'] },
      { id: 'luis', name: 'Luis Rivera', roles: ['kitchen', 'prep'] },
      { id: 'priya', name: 'Priya Shah', roles: ['counter', 'shift-lead'] },
      { id: 'jordan', name: 'Jordan Lee', roles: ['kitchen', 'counter'] },
      { id: 'noor', name: 'Noor Ali', roles: ['barista', 'counter'] },
      { id: 'sam', name: 'Sam Ortiz', roles: ['prep', 'kitchen'] },
      { id: 'alex', name: 'Alex Morgan', roles: ['counter', 'shift-lead'] },
      { id: 'robin', name: 'Robin Kim', roles: ['kitchen', 'prep'] },
      { id: 'jamie', name: 'Jamie Torres', roles: ['counter', 'barista'] }
    ],
    shifts: [
      { id: 'mon-open', date: '2026-12-07', start: '06:00', end: '14:00', role: 'counter', headcount: 2, assignments: ['maya', 'noor'] },
      { id: 'mon-kitchen', date: '2026-12-07', start: '08:00', end: '16:00', role: 'kitchen', headcount: 2, assignments: ['luis', 'jordan'] },
      { id: 'mon-close', date: '2026-12-07', start: '14:00', end: '22:00', role: 'counter', headcount: 1, assignments: ['priya'] },
      { id: 'tue-open', date: '2026-12-08', start: '06:00', end: '14:00', role: 'counter', headcount: 2, assignments: ['maya', 'alex'] },
      { id: 'tue-kitchen', date: '2026-12-08', start: '08:00', end: '16:00', role: 'kitchen', headcount: 2, assignments: ['sam', 'robin'] },
      { id: 'tue-close', date: '2026-12-08', start: '14:00', end: '22:00', role: 'counter', headcount: 1, assignments: ['noor'] },
      { id: 'wed-open', date: '2026-12-09', start: '06:00', end: '14:00', role: 'counter', headcount: 2, assignments: ['jamie', 'priya'] },
      { id: 'wed-prep', date: '2026-12-09', start: '07:00', end: '15:00', role: 'prep', headcount: 1, assignments: ['sam'] },
      { id: 'wed-close', date: '2026-12-09', start: '14:00', end: '22:00', role: 'counter', headcount: 1, assignments: ['maya'] },
      { id: 'thu-open', date: '2026-12-10', start: '06:00', end: '14:00', role: 'counter', headcount: 2, assignments: ['alex', 'jamie'] },
      { id: 'thu-kitchen', date: '2026-12-10', start: '08:00', end: '16:00', role: 'kitchen', headcount: 2, assignments: ['luis', 'robin'] },
      { id: 'thu-close', date: '2026-12-10', start: '14:00', end: '22:00', role: 'counter', headcount: 1, assignments: ['priya'] },
      { id: 'fri-open', date: '2026-12-11', start: '06:00', end: '14:00', role: 'counter', headcount: 2, assignments: ['maya', 'noor'] },
      { id: 'fri-kitchen', date: '2026-12-11', start: '08:00', end: '16:00', role: 'kitchen', headcount: 2, assignments: ['jordan', 'luis'] },
      { id: 'fri-close', date: '2026-12-11', start: '14:00', end: '22:00', role: 'counter', headcount: 1, assignments: ['alex'] },
      { id: 'sat-brunch-counter', date: '2026-12-12', start: '08:00', end: '16:00', role: 'counter', headcount: 2, assignments: ['noor', 'jordan'] },
      { id: 'sat-brunch-kitchen', date: '2026-12-12', start: '08:00', end: '16:00', role: 'kitchen', headcount: 2, assignments: ['luis', 'sam'] },
      { id: 'sat-close', date: '2026-12-12', start: '16:00', end: '23:30', role: 'counter', headcount: 1, assignments: ['priya'] },
      { id: 'sun-brunch-counter', date: '2026-12-13', start: '08:00', end: '16:00', role: 'counter', headcount: 2, assignments: ['alex', 'maya'] },
      { id: 'sun-prep', date: '2026-12-13', start: '07:00', end: '15:00', role: 'prep', headcount: 1, assignments: ['sam'] },
      { id: 'sun-close', date: '2026-12-13', start: '16:00', end: '23:30', role: 'counter', headcount: 1, assignments: ['noor'] }
    ]
  };
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function trimNumber(value) {
  return String(Number(value)).replace(/\.0+$/, '');
}

function dateParts(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m, d };
}

export function timeToMinutes(value) {
  if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return NaN;
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
}

export function dayNumber(isoDate) {
  if (typeof isoDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return NaN;
  const { y, m, d } = dateParts(isoDate);
  const n = Date.UTC(y, m - 1, d) / MINUTES_PER_DAY / 60 / 1000;
  const check = new Date(n * MINUTES_PER_DAY * 60 * 1000);
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== m - 1 || check.getUTCDate() !== d) return NaN;
  return n;
}

export function shiftInterval(shift) {
  const day = dayNumber(shift.date);
  const startMinute = timeToMinutes(shift.start);
  const endMinute = timeToMinutes(shift.end);
  const start = day * MINUTES_PER_DAY + startMinute;
  let end = day * MINUTES_PER_DAY + endMinute;
  if (endMinute < startMinute) end += MINUTES_PER_DAY;
  return { start, end, duration: end - start };
}

export function shiftLabel(shift) {
  const day = dayNumber(shift.date);
  const date = new Date(day * MINUTES_PER_DAY * 60 * 1000);
  const dow = DAYS[date.getUTCDay()];
  const month = MONTHS[date.getUTCMonth()];
  return `${dow} ${month} ${date.getUTCDate()}, ${shift.start}-${shift.end}`;
}

function formatHours(minutes) {
  const hours = minutes / 60;
  const rounded = Math.round(hours * 100) / 100;
  const text = trimNumber(rounded);
  return `${text} hour${rounded === 1 ? '' : 's'}`;
}

function formatMinutesAsHours(minutes) {
  return formatHours(minutes);
}

function sortShifts(shifts) {
  return [...shifts].sort((a, b) => {
    const da = dayNumber(a.date);
    const db = dayNumber(b.date);
    if (da !== db) return da - db;
    const sa = timeToMinutes(a.start);
    const sb = timeToMinutes(b.start);
    if (sa !== sb) return sa - sb;
    return String(a.id).localeCompare(String(b.id));
  });
}

function staffOrder(board) {
  return new Map(board.staff.map((worker, index) => [worker.id, index]));
}

function sortAssignments(board, assignments) {
  const order = staffOrder(board);
  return [...assignments].sort((a, b) => (order.get(a) ?? 999) - (order.get(b) ?? 999));
}

export function cloneBoard(board) {
  return JSON.parse(JSON.stringify(board));
}

export function validateBoard(input) {
  const errors = [];
  if (!isPlainObject(input)) {
    return { ok: false, errors: ['board must be an object'] };
  }
  if (input.schema !== 'shiftswap-board-v1') errors.push('board schema must be shiftswap-board-v1');
  if (!Number.isFinite(dayNumber(input.weekStart))) errors.push('weekStart must be a real YYYY-MM-DD date');
  if (!Number.isInteger(input.revision) || input.revision < 1) errors.push('revision must be a positive integer');
  if (!Array.isArray(input.staff) || input.staff.length === 0) errors.push('staff must be a non-empty array');
  if (!Array.isArray(input.shifts) || input.shifts.length === 0) errors.push('shifts must be a non-empty array');
  if (errors.length) return { ok: false, errors };

  const staffIds = new Set();
  for (const [index, worker] of input.staff.entries()) {
    if (!isPlainObject(worker)) {
      errors.push(`staff ${index} must be an object`);
      continue;
    }
    if (!/^[a-z0-9][a-z0-9-]*$/.test(worker.id || '')) errors.push(`staff ${index} has an invalid id`);
    if (staffIds.has(worker.id)) errors.push(`staff id ${worker.id} is duplicated`);
    staffIds.add(worker.id);
    if (typeof worker.name !== 'string' || worker.name.trim().length < 2) errors.push(`staff ${worker.id || index} needs a name`);
    if (!Array.isArray(worker.roles) || worker.roles.length === 0 || worker.roles.some((role) => typeof role !== 'string' || !role.trim())) {
      errors.push(`staff ${worker.id || index} needs at least one approved role`);
    }
  }

  const shiftIds = new Set();
  const weekStart = dayNumber(input.weekStart);
  for (const [index, shift] of input.shifts.entries()) {
    if (!isPlainObject(shift)) {
      errors.push(`shift ${index} must be an object`);
      continue;
    }
    if (!/^[a-z0-9][a-z0-9-]*$/.test(shift.id || '')) errors.push(`shift ${index} has an invalid id`);
    if (shiftIds.has(shift.id)) errors.push(`shift id ${shift.id} is duplicated`);
    shiftIds.add(shift.id);
    const day = dayNumber(shift.date);
    if (!Number.isFinite(day)) errors.push(`shift ${shift.id || index} has an invalid date`);
    else if (day < weekStart || day > weekStart + 6) errors.push(`shift ${shift.id || index} falls outside the board week`);
    if (!Number.isFinite(timeToMinutes(shift.start))) errors.push(`shift ${shift.id || index} has an invalid start time`);
    if (!Number.isFinite(timeToMinutes(shift.end))) errors.push(`shift ${shift.id || index} has an invalid end time`);
    if (shift.start === shift.end) errors.push(`shift ${shift.id || index} cannot start and end at the same time`);
    if (typeof shift.role !== 'string' || !shift.role.trim()) errors.push(`shift ${shift.id || index} needs a role`);
    if (!Number.isInteger(shift.headcount) || shift.headcount < 1 || shift.headcount > 12) errors.push(`shift ${shift.id || index} needs headcount from 1 to 12`);
    if (!Array.isArray(shift.assignments)) {
      errors.push(`shift ${shift.id || index} assignments must be an array`);
    } else {
      const seen = new Set();
      for (const workerId of shift.assignments) {
        if (!staffIds.has(workerId)) errors.push(`shift ${shift.id || index} assigns unknown staff ${workerId}`);
        if (seen.has(workerId)) errors.push(`shift ${shift.id || index} assigns ${workerId} twice`);
        seen.add(workerId);
      }
      if (Number.isInteger(shift.headcount) && shift.assignments.length > shift.headcount) {
        errors.push(`shift ${shift.id || index} has more assignments than its headcount`);
      }
    }
  }
  return { ok: errors.length === 0, errors };
}

export function assignmentsForWorker(board, workerId) {
  return sortShifts(board.shifts.filter((shift) => shift.assignments.includes(workerId)));
}

function validateTradeShape(board, trade) {
  const errors = [];
  if (!isPlainObject(trade)) return ['trade must be an object'];
  const required = ['sourceShiftId', 'sourceWorkerId', 'counterShiftId', 'counterWorkerId'];
  for (const field of required) {
    if (typeof trade[field] !== 'string' || !trade[field].trim()) errors.push(`${field} is required`);
  }
  if (errors.length) return errors;

  const sourceShift = board.shifts.find((shift) => shift.id === trade.sourceShiftId);
  const counterShift = board.shifts.find((shift) => shift.id === trade.counterShiftId);
  const sourceWorker = board.staff.find((worker) => worker.id === trade.sourceWorkerId);
  const counterWorker = board.staff.find((worker) => worker.id === trade.counterWorkerId);
  if (!sourceShift) errors.push(`unknown source shift ${trade.sourceShiftId}`);
  if (!counterShift) errors.push(`unknown counter shift ${trade.counterShiftId}`);
  if (!sourceWorker) errors.push(`unknown source worker ${trade.sourceWorkerId}`);
  if (!counterWorker) errors.push(`unknown counter worker ${trade.counterWorkerId}`);
  if (errors.length) return errors;

  if (trade.sourceWorkerId === trade.counterWorkerId) errors.push('a worker cannot trade with themself');
  if (trade.sourceShiftId === trade.counterShiftId) errors.push('the two trade shifts must be different');
  if (!sourceShift.assignments.includes(trade.sourceWorkerId)) errors.push(`${sourceWorker.name} is not assigned to ${shiftLabel(sourceShift)}`);
  if (!counterShift.assignments.includes(trade.counterWorkerId)) errors.push(`${counterWorker.name} is not assigned to ${shiftLabel(counterShift)}`);
  if (sourceShift.id !== counterShift.id && counterShift.assignments.includes(trade.sourceWorkerId)) {
    errors.push(`${sourceWorker.name} is already assigned to the incoming shift`);
  }
  if (sourceShift.id !== counterShift.id && sourceShift.assignments.includes(trade.counterWorkerId)) {
    errors.push(`${counterWorker.name} is already assigned to the offered shift`);
  }
  return errors;
}

export function tradeDiff(trade) {
  return [
    { op: 'unassign', shiftId: trade.sourceShiftId, workerId: trade.sourceWorkerId },
    { op: 'unassign', shiftId: trade.counterShiftId, workerId: trade.counterWorkerId },
    { op: 'assign', shiftId: trade.sourceShiftId, workerId: trade.counterWorkerId },
    { op: 'assign', shiftId: trade.counterShiftId, workerId: trade.sourceWorkerId }
  ];
}

export function applyScheduleDiff(board, diff) {
  if (!Array.isArray(diff) || diff.length === 0) return { ok: false, errors: ['diff must be a non-empty array'] };
  const next = cloneBoard(board);
  const errors = [];
  diff.forEach((entry, index) => {
    if (!isPlainObject(entry) || (entry.op !== 'assign' && entry.op !== 'unassign')) {
      errors.push(`diff ${index} must use op assign or unassign`);
      return;
    }
    const shift = next.shifts.find((item) => item.id === entry.shiftId);
    const worker = next.staff.find((item) => item.id === entry.workerId);
    if (!shift) {
      errors.push(`diff ${index} names unknown shift ${entry.shiftId}`);
      return;
    }
    if (!worker) {
      errors.push(`diff ${index} names unknown worker ${entry.workerId}`);
      return;
    }
    const at = shift.assignments.indexOf(entry.workerId);
    if (entry.op === 'assign') {
      if (at !== -1) errors.push(`diff ${index} assigns ${entry.workerId} twice`);
      else shift.assignments.push(entry.workerId);
    } else {
      if (at === -1) errors.push(`diff ${index} unassigns ${entry.workerId} who is not on the shift`);
      else shift.assignments.splice(at, 1);
    }
  });
  if (!errors.length) {
    for (const shift of next.shifts) shift.assignments = sortAssignments(next, shift.assignments);
    const shape = validateBoard(next);
    errors.push(...shape.errors);
  }
  return errors.length ? { ok: false, errors } : { ok: true, board: next, errors: [] };
}

export function simulateTrade(board, trade) {
  const errors = validateTradeShape(board, trade);
  if (errors.length) return { ok: false, errors };
  const applied = applyScheduleDiff(board, tradeDiff(trade));
  if (!applied.ok) return { ok: false, errors: applied.errors };
  return { ok: true, board: applied.board, diff: tradeDiff(trade), errors: [] };
}

function overlapMinutes(a, b) {
  return Math.max(0, Math.min(a.end, b.end) - Math.max(a.start, b.start));
}

function workerEvaluations(board, workerId, policy) {
  const worker = board.staff.find((item) => item.id === workerId);
  const assigned = assignmentsForWorker(board, workerId).map((shift) => ({ shift, interval: shiftInterval(shift) }));
  const restThreshold = Math.round(policy.restGapHours * 60);
  const restPairs = [];
  for (let index = 1; index < assigned.length; index += 1) {
    const previous = assigned[index - 1];
    const current = assigned[index];
    restPairs.push({
      previous,
      current,
      gap: current.interval.start - previous.interval.end
    });
  }
  const restFailures = restPairs.filter((pair) => pair.gap < restThreshold);
  const restMin = restPairs.length ? Math.min(...restPairs.map((pair) => pair.gap)) : null;
  const restMessage = restFailures.length
    ? `${worker.name} has only ${restFailures.map((pair) => `${formatMinutesAsHours(pair.gap)} between ${shiftLabel(pair.previous.shift)} and ${shiftLabel(pair.current.shift)}`).join(' and ')}; the rule requires ${formatHours(restThreshold)}.`
    : restPairs.length
      ? `${worker.name} has at least ${formatHours(restThreshold)} between every adjacent shift.`
      : `${worker.name} has no adjacent pair of shifts.`;

  const totalMinutes = assigned.reduce((sum, item) => sum + item.interval.duration, 0);
  const maxMinutes = Math.round(policy.maxWeeklyHours * 60);
  const hoursPassed = totalMinutes <= maxMinutes;
  const hoursMessage = hoursPassed
    ? `${worker.name} is scheduled for ${formatMinutesAsHours(totalMinutes)} of the ${formatHours(maxMinutes)} weekly limit.`
    : `${worker.name} would reach ${formatMinutesAsHours(totalMinutes)}, above the ${formatHours(maxMinutes)} weekly limit.`;

  const roleFailures = assigned.filter((item) => !worker.roles.includes(item.shift.role));
  const roleMessage = roleFailures.length
    ? `${worker.name} is not approved for ${roleFailures.map((item) => `${item.shift.role} on ${shiftLabel(item.shift)}`).join(' and ')}.`
    : `${worker.name} is approved for every assigned role.`;

  const overlaps = [];
  for (let outer = 0; outer < assigned.length; outer += 1) {
    for (let inner = outer + 1; inner < assigned.length; inner += 1) {
      const overlap = overlapMinutes(assigned[outer].interval, assigned[inner].interval);
      if (overlap > 0) overlaps.push({ first: assigned[outer], second: assigned[inner], overlap });
    }
  }
  const overlapMessage = overlaps.length
    ? `${worker.name} overlaps by ${overlaps.map((item) => `${item.overlap} minute${item.overlap === 1 ? '' : 's'} on ${shiftLabel(item.first.shift)} and ${shiftLabel(item.second.shift)}`).join(' and ')}.`
    : `${worker.name} has no overlapping assignments.`;

  return [
    { ruleId: 'rest-gap', workerId, passed: restFailures.length === 0, message: restMessage, measuredMinutes: restMin, thresholdMinutes: restThreshold },
    { ruleId: 'max-weekly-hours', workerId, passed: hoursPassed, message: hoursMessage, measuredMinutes: totalMinutes, thresholdMinutes: maxMinutes },
    { ruleId: 'role-match', workerId, passed: roleFailures.length === 0, message: roleMessage, measuredMinutes: null, thresholdMinutes: null },
    { ruleId: 'double-booking', workerId, passed: overlaps.length === 0, message: overlapMessage, measuredMinutes: overlaps.reduce((sum, item) => sum + item.overlap, 0), thresholdMinutes: 0 }
  ];
}

export function evaluateBoardPolicy(board, policy = defaultPolicy()) {
  return board.staff.flatMap((worker) => workerEvaluations(board, worker.id, policy)).filter((result) => !result.passed);
}

export function validateTrade(board, trade, policy = defaultPolicy()) {
  const boardShape = validateBoard(board);
  if (!boardShape.ok) return { ok: false, errors: boardShape.errors, ruleResults: [], failingRules: [] };
  const errors = validateTradeShape(board, trade);
  if (errors.length) return { ok: false, errors, ruleResults: [], failingRules: [] };
  const simulated = simulateTrade(board, trade);
  if (!simulated.ok) return { ok: false, errors: simulated.errors, ruleResults: [], failingRules: [] };

  const evaluations = [trade.sourceWorkerId, trade.counterWorkerId]
    .flatMap((workerId) => workerEvaluations(simulated.board, workerId, policy));
  const ruleResults = policyRules(policy).map((rule) => {
    const workers = evaluations.filter((item) => item.ruleId === rule.id);
    const failures = workers.filter((item) => !item.passed);
    return {
      ruleId: rule.id,
      code: rule.code,
      name: rule.name,
      thresholdLabel: rule.thresholdLabel,
      passed: failures.length === 0,
      workers,
      message: failures.length
        ? `${rule.code} ${rule.name} fails. ${failures.map((item) => item.message).join(' ')}`
        : `${rule.code} ${rule.name} passes for both workers.`
    };
  });
  const failingRules = ruleResults.filter((rule) => !rule.passed).map((rule) => rule.ruleId);
  return {
    ok: failingRules.length === 0,
    errors: [],
    ruleResults,
    failingRules,
    diff: simulated.diff,
    resultingBoard: simulated.board
  };
}

export function republishBoard(board) {
  const shape = validateBoard(board);
  if (!shape.ok) throw new TypeError(`cannot republish malformed board: ${shape.errors.join('; ')}`);
  const next = cloneBoard(board);
  next.revision += 1;
  return next;
}

export function acceptTrade(board, trade, policy = defaultPolicy()) {
  const validation = validateTrade(board, trade, policy);
  if (!validation.ok) return { ok: false, validation, errors: validation.errors };
  return {
    ok: true,
    validation,
    diff: validation.diff,
    board: republishBoard(validation.resultingBoard),
    errors: []
  };
}

function normalizeRole(role) {
  return String(role || '').trim().toLowerCase().replace(/\s+/g, '-');
}

export function publishShift(board, draft, policy = defaultPolicy()) {
  const baseShape = validateBoard(board);
  if (!baseShape.ok) return { ok: false, errors: baseShape.errors };
  if (!isPlainObject(draft)) return { ok: false, errors: ['shift draft must be an object'] };
  const errors = [];
  const id = typeof draft.id === 'string' && draft.id.trim() ? draft.id.trim() : `shift-${board.shifts.length + 1}`;
  const role = normalizeRole(draft.role);
  const assignments = Array.isArray(draft.assignments) ? [...draft.assignments] : [];
  if (draft.assignments !== undefined && !Array.isArray(draft.assignments)) errors.push('shift assignments must be an array');
  const shift = {
    id,
    date: typeof draft.date === 'string' ? draft.date.trim() : '',
    start: typeof draft.start === 'string' ? draft.start.trim() : '',
    end: typeof draft.end === 'string' ? draft.end.trim() : '',
    role,
    headcount: Number(draft.headcount),
    assignments
  };
  if (board.shifts.some((item) => item.id === id)) errors.push(`shift id ${id} already exists`);
  const candidate = cloneBoard(board);
  candidate.shifts.push(shift);
  const shape = validateBoard(candidate);
  errors.push(...shape.errors.filter((error) => error.includes(id) || error.includes('assigns unknown')));
  if (!errors.length) {
    const policyFailures = evaluateBoardPolicy(candidate, policy).filter((failure) => shift.assignments.includes(failure.workerId));
    for (const failure of policyFailures) {
      const rule = policyRules(policy).find((item) => item.id === failure.ruleId);
      errors.push(`${rule.code} ${rule.name} fails for the new assignment. ${failure.message}`);
    }
  }
  if (errors.length) return { ok: false, errors, shift };
  return { ok: true, errors: [], shift, board: republishBoard(candidate) };
}

export function diffSchedules(before, after) {
  const diff = [];
  const shiftIds = [...new Set([...before.shifts.map((shift) => shift.id), ...after.shifts.map((shift) => shift.id)])];
  for (const shiftId of shiftIds) {
    const oldShift = before.shifts.find((shift) => shift.id === shiftId);
    const newShift = after.shifts.find((shift) => shift.id === shiftId);
    const oldAssignments = new Set(oldShift ? oldShift.assignments : []);
    const newAssignments = new Set(newShift ? newShift.assignments : []);
    for (const workerId of oldAssignments) {
      if (!newAssignments.has(workerId)) diff.push({ op: 'unassign', shiftId, workerId });
    }
    for (const workerId of newAssignments) {
      if (!oldAssignments.has(workerId)) diff.push({ op: 'assign', shiftId, workerId });
    }
  }
  return diff;
}

function displayRole(role) {
  return String(role).replace(/-/g, ' ');
}

export function buildPrintPayload(board, policy = defaultPolicy()) {
  const shape = validateBoard(board);
  if (!shape.ok) throw new TypeError(`cannot print malformed board: ${shape.errors.join('; ')}`);
  const staff = new Map(board.staff.map((worker) => [worker.id, worker]));
  const rows = sortShifts(board.shifts).map((shift) => {
    const date = new Date(dayNumber(shift.date) * MINUTES_PER_DAY * 60 * 1000);
    const day = DAYS[date.getUTCDay()];
    const names = shift.assignments.map((workerId) => staff.get(workerId).name);
    return {
      shiftId: shift.id,
      day,
      date: shift.date,
      time: `${shift.start}-${shift.end}`,
      role: displayRole(shift.role),
      coverage: `${shift.assignments.length}/${shift.headcount}`,
      assignments: names
    };
  });
  const policyRows = policyRules(policy).map((rule) => ({
    code: rule.code,
    name: rule.name,
    threshold: rule.thresholdLabel
  }));
  const lines = [
    'ShiftSwap weekly board',
    `Week of ${board.weekStart}`,
    `Revision ${board.revision}`,
    'Local printable board',
    '',
    'Policy',
    ...policyRows.map((rule) => `${rule.code} ${rule.name} - ${rule.threshold}`),
    ''
  ];
  let lastDate = '';
  for (const row of rows) {
    if (row.date !== lastDate) {
      lines.push(`${row.day} ${row.date}`);
      lastDate = row.date;
    }
    const people = row.assignments.length ? row.assignments.join(', ') : 'unfilled';
    lines.push(`  ${row.time} ${row.role} ${row.coverage} covered - ${people}`);
  }
  return {
    title: 'ShiftSwap weekly board',
    weekStart: board.weekStart,
    revision: board.revision,
    policy: policyRows,
    rows,
    lines,
    text: lines.join('\n')
  };
}

export function boardSummary(board) {
  const assignments = board.shifts.reduce((sum, shift) => sum + shift.assignments.length, 0);
  const seats = board.shifts.reduce((sum, shift) => sum + shift.headcount, 0);
  return {
    shifts: board.shifts.length,
    staff: board.staff.length,
    assignments,
    seats,
    coverage: seats ? assignments / seats : 0
  };
}

export const internals = {
  formatHours,
  sortShifts,
  workerEvaluations,
  validateTradeShape,
  normalizeRole
};
