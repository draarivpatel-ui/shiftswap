import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = fileURLToPath(new URL('.', import.meta.url));
const manifest = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'));
const starts = new Map(manifest.sentences.map((entry) => [`${entry.para}:${entry.sent}`, entry.start]));
const at = (key, offset = 0) => Math.round((starts.get(key) + offset) * 100) / 100;
const total = manifest.total;

const steps = [
  { do: 'at', s: 0.55 },
  { do: 'move', selector: '#week-board', ms: 850 },

  { do: 'at', s: at('1:0', 0.15) },
  { do: 'move', selector: '[data-source-shift="mon-open"][data-source-worker="noor"]', ms: 850 },

  { do: 'at', s: at('2:0', 0.1) },
  { do: 'click', selector: '[data-source-shift="mon-open"][data-source-worker="noor"]' },
  { do: 'select', selector: '#counter-worker', value: 'jamie' },
  { do: 'wait', ms: 350 },
  { do: 'select', selector: '#counter-shift', value: 'wed-open' },

  { do: 'at', s: at('2:1', -0.2) },
  { do: 'click', selector: '#check-trade' },

  { do: 'at', s: at('2:1', 1.1) },
  { do: 'move', selector: '.rule-result.fail', ms: 800 },

  { do: 'at', s: at('3:0', 0.1) },
  { do: 'move', selector: '#policy-list .policy-rule:first-child', ms: 800 },

  { do: 'at', s: at('4:0', 0.1) },
  { do: 'click', selector: '[data-source-shift="wed-close"][data-source-worker="maya"]' },
  { do: 'select', selector: '#counter-worker', value: 'alex' },
  { do: 'wait', ms: 350 },
  { do: 'select', selector: '#counter-shift', value: 'thu-open' },

  { do: 'at', s: at('4:1', -0.3) },
  { do: 'click', selector: '#check-trade' },

  { do: 'at', s: at('4:1', 1.35) },
  { do: 'click', selector: '#accept-trade' },

  { do: 'at', s: at('5:0', 0.15) },
  { do: 'move', selector: '#revision-number', ms: 700 },
  { do: 'wait', ms: 350 },
  { do: 'scrollTo', selector: '#print-title', ms: 1300, offset: 90 },

  { do: 'at', s: at('6:0', 0.1) },
  { do: 'move', selector: '#print-payload', ms: 800 },

  { do: 'at', s: at('6:1', 0.15) },
  { do: 'scrollTo', selector: '#week-title', ms: 1300, offset: 78 },
  { do: 'at', s: at('6:1', 1.65) },
  { do: 'move', selector: '#print-board', ms: 850 },

  { do: 'at', s: Math.max(0, total + 0.55) }
];

const marks = steps.filter((step) => step.do === 'at').map((step) => step.s);
if (marks.some((mark, index) => index && mark < marks[index - 1])) {
  throw new Error(`at marks went backwards: ${marks.join(', ')}`);
}
writeFileSync(join(dir, 'steps.json'), `${JSON.stringify(steps, null, 1)}\n`);
console.log(`steps.json written for ${total.toFixed(2)} s narration`);
