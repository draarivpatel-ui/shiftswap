import {
  acceptTrade,
  boardSummary,
  buildPrintPayload,
  cloneBoard,
  createSampleBoard,
  defaultPolicy,
  dayNumber,
  internals,
  policyRules,
  publishShift,
  shiftLabel,
  validateBoard,
  validateTrade
} from './core.js';

const policy = defaultPolicy();
const storageKey = 'shiftswap-board-v1';
const params = new URLSearchParams(window.location.search);
const scenario = params.get('shot') || '';
const ephemeral = Boolean(scenario);

const $ = (id) => document.getElementById(id);
const nodes = {
  saveState: $('save-state'),
  resetBoard: $('reset-board'),
  printBoard: $('print-board'),
  weekRange: $('week-range'),
  revisionNumber: $('revision-number'),
  boardStats: $('board-stats'),
  weekBoard: $('week-board'),
  publishPanel: $('publish-panel'),
  publishForm: $('publish-form'),
  publishErrors: $('publish-errors'),
  newDate: $('new-date'),
  newStart: $('new-start'),
  newEnd: $('new-end'),
  newRole: $('new-role'),
  newHeadcount: $('new-headcount'),
  newAssignees: $('new-assignees'),
  sourceShift: $('source-shift'),
  sourceWorker: $('source-worker'),
  counterWorker: $('counter-worker'),
  counterShift: $('counter-shift'),
  checkTrade: $('check-trade'),
  acceptTrade: $('accept-trade'),
  validationResults: $('validation-results'),
  policyList: $('policy-list'),
  printPayload: $('print-payload'),
  printSheet: $('print-sheet'),
  toast: $('toast')
};

function loadStoredBoard() {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return validateBoard(parsed).ok ? parsed : null;
  } catch {
    return null;
  }
}

let board = ephemeral ? createSampleBoard() : (loadStoredBoard() || createSampleBoard());
let selection = {
  sourceShiftId: '',
  sourceWorkerId: '',
  counterWorkerId: '',
  counterShiftId: ''
};
let lastValidation = null;
let lastAcceptedMessage = '';
let toastTimer = 0;

const exampleTrades = {
  fail: {
    sourceShiftId: 'mon-open',
    sourceWorkerId: 'noor',
    counterWorkerId: 'jamie',
    counterShiftId: 'wed-open'
  },
  pass: {
    sourceShiftId: 'wed-close',
    sourceWorkerId: 'maya',
    counterWorkerId: 'alex',
    counterShiftId: 'thu-open'
  }
};

function saveBoard() {
  if (ephemeral) return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(board));
    nodes.saveState.textContent = 'Saved in this browser';
  } catch {
    nodes.saveState.textContent = 'Local save unavailable';
  }
}

function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

function workerById(id) {
  return board.staff.find((worker) => worker.id === id);
}

function shiftById(id) {
  return board.shifts.find((shift) => shift.id === id);
}

function dateLabel(iso) {
  const date = new Date(dayNumber(iso) * 24 * 60 * 60 * 1000);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function weekEnd(iso) {
  const day = dayNumber(iso) + 6;
  const date = new Date(day * 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 10);
}

function shiftOptionLabel(shift) {
  return `${shiftLabel(shift)} - ${shift.role.replace(/-/g, ' ')}`;
}

function fingerprint(current = selection) {
  return JSON.stringify(current);
}

function setExample(name) {
  selection = { ...exampleTrades[name] };
  lastAcceptedMessage = '';
  lastValidation = validateTrade(board, selection, policy);
  renderAll();
}

function clearValidation() {
  lastValidation = null;
  lastAcceptedMessage = '';
}

function renderBoard() {
  nodes.weekRange.textContent = `${board.weekStart} through ${weekEnd(board.weekStart)}`;
  nodes.revisionNumber.textContent = String(board.revision);

  const summary = boardSummary(board);
  clear(nodes.boardStats);
  const stats = [
    ['shifts', summary.shifts],
    ['staff', summary.staff],
    ['seats filled', `${summary.assignments}/${summary.seats}`],
    ['coverage', `${Math.round(summary.coverage * 100)}%`]
  ];
  for (const [label, value] of stats) {
    const pill = make('span', 'stat-pill');
    const strong = make('strong', '', String(value));
    pill.append(strong, document.createTextNode(` ${label}`));
    nodes.boardStats.append(pill);
  }

  clear(nodes.weekBoard);
  const byDate = new Map();
  for (const shift of internals.sortShifts(board.shifts)) {
    if (!byDate.has(shift.date)) byDate.set(shift.date, []);
    byDate.get(shift.date).push(shift);
  }

  for (const [date, shifts] of byDate.entries()) {
    const row = make('section', 'day-row');
    const label = make('div', 'day-label');
    label.append(make('strong', '', dateLabel(date).split(',')[0]), make('span', '', date));
    const strip = make('div', 'shift-strip');

    for (const shift of shifts) {
      const classes = ['shift-card'];
      if (shift.id === selection.sourceShiftId) classes.push('selected');
      if (shift.id === selection.counterShiftId) classes.push('counter-selected');
      const card = make('article', classes.join(' '));
      card.dataset.shiftId = shift.id;

      const top = make('div', 'shift-topline');
      top.append(make('span', 'shift-time', `${shift.start}-${shift.end}`), make('span', 'coverage', `${shift.assignments.length}/${shift.headcount}`));
      const role = make('h3', 'shift-role', shift.role.replace(/-/g, ' '));
      const workers = make('div', 'worker-list');
      for (const workerId of shift.assignments) {
        const worker = workerById(workerId);
        const chip = make('button', 'worker-chip');
        chip.type = 'button';
        chip.dataset.sourceShift = shift.id;
        chip.dataset.sourceWorker = workerId;
        chip.setAttribute('aria-pressed', String(shift.id === selection.sourceShiftId && workerId === selection.sourceWorkerId));
        chip.setAttribute('aria-label', `Offer ${worker.name} on ${shiftLabel(shift)}`);
        chip.append(make('span', '', worker.name), make('small', '', 'offer'));
        workers.append(chip);
      }
      for (let empty = shift.assignments.length; empty < shift.headcount; empty += 1) {
        workers.append(make('span', 'open-seat', 'open seat'));
      }
      card.append(top, role, workers);
      strip.append(card);
    }
    row.append(label, strip);
    nodes.weekBoard.append(row);
  }
}

function fillSelect(select, items, current, placeholder) {
  clear(select);
  const empty = document.createElement('option');
  empty.value = '';
  empty.textContent = placeholder;
  select.append(empty);
  for (const item of items) {
    const option = document.createElement('option');
    option.value = item.value;
    option.textContent = item.label;
    select.append(option);
  }
  select.value = items.some((item) => item.value === current) ? current : '';
}

function renderTradePanel() {
  const sourceShift = shiftById(selection.sourceShiftId);
  if (!sourceShift) selection.sourceWorkerId = '';
  else if (!sourceShift.assignments.includes(selection.sourceWorkerId)) selection.sourceWorkerId = '';

  const sourceWorkerItems = sourceShift
    ? sourceShift.assignments.map((workerId) => ({ value: workerId, label: workerById(workerId).name }))
    : [];
  fillSelect(nodes.sourceShift, internals.sortShifts(board.shifts).map((shift) => ({ value: shift.id, label: shiftOptionLabel(shift) })), selection.sourceShiftId, 'Choose a shift');
  fillSelect(nodes.sourceWorker, sourceWorkerItems, selection.sourceWorkerId, sourceShift ? 'Choose a worker' : 'Choose the offered shift first');
  nodes.sourceWorker.disabled = !sourceShift;

  if (selection.sourceWorkerId && selection.counterWorkerId === selection.sourceWorkerId) selection.counterWorkerId = '';
  const counterWorkers = board.staff
    .filter((worker) => worker.id !== selection.sourceWorkerId)
    .filter((worker) => assignmentsFor(worker.id).some((shift) => shift.id !== selection.sourceShiftId))
    .map((worker) => ({ value: worker.id, label: worker.name }));
  if (!counterWorkers.some((item) => item.value === selection.counterWorkerId)) selection.counterWorkerId = '';
  fillSelect(nodes.counterWorker, counterWorkers, selection.counterWorkerId, selection.sourceWorkerId ? 'Choose a worker' : 'Choose the giving worker first');
  nodes.counterWorker.disabled = !selection.sourceWorkerId;

  const counterShiftItems = selection.counterWorkerId
    ? assignmentsFor(selection.counterWorkerId)
      .filter((shift) => shift.id !== selection.sourceShiftId)
      .map((shift) => ({ value: shift.id, label: shiftOptionLabel(shift) }))
    : [];
  if (!counterShiftItems.some((item) => item.value === selection.counterShiftId)) selection.counterShiftId = '';
  fillSelect(nodes.counterShift, counterShiftItems, selection.counterShiftId, selection.counterWorkerId ? 'Choose a shift' : 'Choose the trading worker first');
  nodes.counterShift.disabled = !selection.counterWorkerId;

  const complete = selection.sourceShiftId && selection.sourceWorkerId && selection.counterWorkerId && selection.counterShiftId;
  nodes.checkTrade.disabled = !complete;
  nodes.acceptTrade.disabled = !(complete && lastValidation && lastValidation.ok && lastValidation.fingerprint === fingerprint());
}

function assignmentsFor(workerId) {
  return internals.sortShifts(board.shifts.filter((shift) => shift.assignments.includes(workerId)));
}

function renderValidation() {
  clear(nodes.validationResults);
  if (lastAcceptedMessage) {
    const accepted = make('div', 'rule-result pass');
    accepted.append(make('p', '', lastAcceptedMessage));
    nodes.validationResults.append(accepted);
    return;
  }
  if (!lastValidation) {
    const empty = make('div', 'validation-empty');
    empty.append(make('p', '', 'No trade has been checked yet.'));
    nodes.validationResults.append(empty);
    return;
  }
  if (lastValidation.errors.length) {
    const box = make('div', 'validation-error');
    for (const error of lastValidation.errors) box.append(make('p', '', error));
    nodes.validationResults.append(box);
    return;
  }
  for (const rule of lastValidation.ruleResults) {
    const card = make('article', `rule-result ${rule.passed ? 'pass' : 'fail'}`);
    const head = make('div', 'rule-head');
    head.append(make('strong', '', `${rule.code} ${rule.name}`), make('span', '', rule.thresholdLabel));
    const message = make('p', '', rule.message);
    card.append(head, message);
    nodes.validationResults.append(card);
  }
}

function renderPolicy() {
  clear(nodes.policyList);
  for (const rule of policyRules(policy)) {
    const item = make('article', 'policy-rule');
    item.append(make('span', 'policy-code', rule.code));
    const body = make('div');
    body.append(make('strong', '', rule.name));
    body.append(make('span', 'policy-threshold', rule.thresholdLabel));
    body.append(make('p', '', rule.statement));
    item.append(body);
    nodes.policyList.append(item);
  }
}

function renderPrint() {
  const payload = buildPrintPayload(board, policy);
  nodes.printPayload.textContent = payload.text;

  clear(nodes.printSheet);
  const title = make('h1', '', payload.title);
  const meta = make('div', 'print-meta');
  meta.append(make('span', '', `Week of ${payload.weekStart}`), make('span', '', `Revision ${payload.revision}`));
  const policyTable = make('table', 'print-policy');
  const policyHead = make('tr');
  for (const heading of ['Rule', 'Name', 'Threshold']) policyHead.append(make('th', '', heading));
  policyTable.append(policyHead);
  for (const rule of payload.policy) {
    const row = make('tr');
    row.append(make('td', '', rule.code), make('td', '', rule.name), make('td', '', rule.threshold));
    policyTable.append(row);
  }
  nodes.printSheet.append(title, meta, policyTable);

  const byDate = new Map();
  for (const row of payload.rows) {
    if (!byDate.has(row.date)) byDate.set(row.date, []);
    byDate.get(row.date).push(row);
  }
  for (const [date, rows] of byDate.entries()) {
    const table = make('table', 'print-day');
    table.append(make('caption', '', `${rows[0].day} ${date}`));
    const head = make('tr');
    for (const heading of ['Time', 'Role', 'Coverage', 'Assigned']) head.append(make('th', '', heading));
    table.append(head);
    for (const rowData of rows) {
      const row = make('tr');
      row.append(
        make('td', '', rowData.time),
        make('td', '', rowData.role),
        make('td', '', rowData.coverage),
        make('td', '', rowData.assignments.join(', ') || 'unfilled')
      );
      table.append(row);
    }
    nodes.printSheet.append(table);
  }
}

function renderPublishForm() {
  clear(nodes.newDate);
  for (let index = 0; index < 7; index += 1) {
    const date = new Date((dayNumber(board.weekStart) + index) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const option = document.createElement('option');
    option.value = date;
    option.textContent = `${dateLabel(date)} ${date}`;
    nodes.newDate.append(option);
  }
  nodes.newDate.value = board.weekStart;

  clear(nodes.newAssignees);
  for (const worker of board.staff) {
    const label = make('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = worker.id;
    input.name = 'assignee';
    label.append(input, document.createTextNode(`${worker.name} - ${worker.roles.join(', ')}`));
    nodes.newAssignees.append(label);
  }
}

function renderAll() {
  renderBoard();
  renderTradePanel();
  renderValidation();
  renderPolicy();
  renderPrint();
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  nodes.toast.textContent = message;
  nodes.toast.classList.remove('show');
  void nodes.toast.offsetWidth;
  nodes.toast.classList.add('show');
  toastTimer = window.setTimeout(() => nodes.toast.classList.remove('show'), 3700);
}

function runValidation() {
  lastAcceptedMessage = '';
  if (!(selection.sourceShiftId && selection.sourceWorkerId && selection.counterWorkerId && selection.counterShiftId)) {
    lastValidation = { ok: false, errors: ['Choose both workers and both shifts before checking.'], ruleResults: [], failingRules: [] };
  } else {
    lastValidation = validateTrade(board, selection, policy);
    lastValidation.fingerprint = fingerprint();
  }
  renderAll();
}

function acceptCurrentTrade() {
  if (!lastValidation || !lastValidation.ok || lastValidation.fingerprint !== fingerprint()) return;
  const result = acceptTrade(board, selection, policy);
  if (!result.ok) {
    lastValidation = result.validation;
    renderAll();
    return;
  }
  board = result.board;
  saveBoard();
  const sourceWorker = workerById(selection.sourceWorkerId);
  const counterWorker = workerById(selection.counterWorkerId);
  lastValidation = null;
  lastAcceptedMessage = `Trade accepted. ${sourceWorker.name} and ${counterWorker.name} are republished on revision ${board.revision}.`;
  selection = { sourceShiftId: '', sourceWorkerId: '', counterWorkerId: '', counterShiftId: '' };
  renderAll();
  showToast(`Revision ${board.revision} is ready to print`);
}

function nextShiftId() {
  let index = board.shifts.length + 1;
  while (shiftById(`shift-${index}`)) index += 1;
  return `shift-${index}`;
}

nodes.weekBoard.addEventListener('click', (event) => {
  const chip = event.target.closest('.worker-chip');
  if (!chip) return;
  selection.sourceShiftId = chip.dataset.sourceShift;
  selection.sourceWorkerId = chip.dataset.sourceWorker;
  clearValidation();
  renderAll();
});

nodes.sourceShift.addEventListener('change', () => {
  selection.sourceShiftId = nodes.sourceShift.value;
  clearValidation();
  renderAll();
});

nodes.sourceWorker.addEventListener('change', () => {
  selection.sourceWorkerId = nodes.sourceWorker.value;
  clearValidation();
  renderAll();
});

nodes.counterWorker.addEventListener('change', () => {
  selection.counterWorkerId = nodes.counterWorker.value;
  clearValidation();
  renderAll();
});

nodes.counterShift.addEventListener('change', () => {
  selection.counterShiftId = nodes.counterShift.value;
  clearValidation();
  renderAll();
});

nodes.checkTrade.addEventListener('click', runValidation);
nodes.acceptTrade.addEventListener('click', acceptCurrentTrade);

for (const button of document.querySelectorAll('[data-example]')) {
  button.addEventListener('click', () => setExample(button.dataset.example));
}

nodes.printBoard.addEventListener('click', () => window.print());

nodes.resetBoard.addEventListener('click', () => {
  if (!window.confirm('Reset the local board to the sample week?')) return;
  board = createSampleBoard();
  selection = { sourceShiftId: '', sourceWorkerId: '', counterWorkerId: '', counterShiftId: '' };
  clearValidation();
  saveBoard();
  renderAll();
  showToast('Sample week restored');
});

nodes.publishForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const assignments = [...nodes.publishForm.querySelectorAll('input[name="assignee"]:checked')].map((input) => input.value);
  const result = publishShift(board, {
    id: nextShiftId(),
    date: nodes.newDate.value,
    start: nodes.newStart.value,
    end: nodes.newEnd.value,
    role: nodes.newRole.value,
    headcount: Number(nodes.newHeadcount.value),
    assignments
  }, policy);
  clear(nodes.publishErrors);
  if (!result.ok) {
    for (const error of result.errors) nodes.publishErrors.append(make('p', '', error));
    return;
  }
  board = result.board;
  clearValidation();
  saveBoard();
  renderAll();
  showToast(`${result.shift.id} published in revision ${board.revision}`);
});

if (scenario === 'fail' || scenario === 'pass') {
  selection = { ...exampleTrades[scenario] };
  lastValidation = validateTrade(board, selection, policy);
  lastValidation.fingerprint = fingerprint();
} else if (scenario === 'accepted') {
  selection = { ...exampleTrades.pass };
  lastValidation = validateTrade(board, selection, policy);
  lastValidation.fingerprint = fingerprint();
  const result = acceptTrade(board, selection, policy);
  if (result.ok) {
    board = result.board;
    lastAcceptedMessage = `Trade accepted. Maya Chen and Alex Morgan are republished on revision ${board.revision}.`;
    lastValidation = null;
    selection = { sourceShiftId: '', sourceWorkerId: '', counterWorkerId: '', counterShiftId: '' };
  }
}

renderPublishForm();
renderAll();

if ('serviceWorker' in navigator && /^https?:$/.test(window.location.protocol)) {
  navigator.serviceWorker.register('sw.js').catch(() => {
    nodes.saveState.textContent = 'Local board ready';
  });
}

window.__shiftswap = {
  getBoard: () => cloneBoard(board),
  getSelection: () => ({ ...selection }),
  setExample,
  runValidation,
  acceptCurrentTrade,
  validate: (trade) => validateTrade(board, trade, policy),
  printPayload: () => buildPrintPayload(board, policy)
};
