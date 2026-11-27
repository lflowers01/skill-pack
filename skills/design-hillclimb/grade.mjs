// Design hillclimb judge: grades every screenshot of a version against rubric.md and writes results.jsonl + summary.json.
// node grade.mjs <flowDir> <version> [--reps 2] [--split train|test|all] [--jobs 4] [--judge auto|claude|codex] [--model <id>]
//   flowDir/context.txt   product context + deliberate brand choices (+ platform)
//   flowDir/cases.json    [{ id, split: "train"|"test", purpose, platform? }]
//   flowDir/<version>/shots/<id>.png
// Judges: Claude Code (`claude -p`, default Opus) or Codex (`codex exec -i`). Both run on the user's own plan, no tools, no session kept.
// Resumable: rows already in results.jsonl are skipped.
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const H = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'h7', 'h8', 'h9', 'h10'];
const C = ['c_hierarchy', 'c_one_primary', 'c_spacing', 'c_alignment', 'c_type', 'c_targets', 'c_contrast', 'c_copy', 'c_density', 'c_states', 'c_platform', 'c_no_slop'];

const args = process.argv.slice(2);
const [flow, version] = args;
if (!flow || !version) { console.error('usage: node grade.mjs <flowDir> <version> [--reps 2] [--split all] [--jobs 4] [--judge auto|claude|codex] [--model id]'); process.exit(1); }
const opt = (k, d) => { const i = args.indexOf(k); return i > 1 ? args[i + 1] : d; };
const REPS = +opt('--reps', 2), SPLIT = opt('--split', 'all'), JOBS = +opt('--jobs', 4);
const has = (cmd) => { try { execFileSync(process.platform === 'win32' ? 'where' : 'which', [cmd], { stdio: 'ignore' }); return true; } catch { return false; } };
let JUDGE = opt('--judge', 'auto');
if (JUDGE === 'auto') JUDGE = has('claude') ? 'claude' : has('codex') ? 'codex' : null;
if (!JUDGE) { console.error('Need Claude Code (`claude`) or Codex (`codex`) on PATH, signed in.'); process.exit(1); }
const MODEL = opt('--model', JUDGE === 'claude' ? 'claude-opus-5-5' : '');

const dir = path.join(flow, version);
const CONTEXT = fs.readFileSync(path.join(flow, 'context.txt'), 'utf8').trim();
const CASES = JSON.parse(fs.readFileSync(path.join(flow, 'cases.json'), 'utf8'));
const RUBRIC = fs.readFileSync(path.join(here, 'rubric.md'), 'utf8');

const SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['heuristics', 'checklist', 'overall', 'issues', 'explanation'],
  properties: {
    heuristics: { type: 'object', additionalProperties: false, required: H, properties: Object.fromEntries(H.map(h => [h, { type: 'integer', minimum: 0, maximum: 4 }])) },
    checklist: { type: 'object', additionalProperties: false, required: C, properties: Object.fromEntries(C.map(c => [c, { type: 'boolean' }])) },
    overall: { type: 'integer', minimum: 1, maximum: 10 },
    issues: { type: 'array', maxItems: 3, items: { type: 'object', additionalProperties: false, required: ['severity', 'element', 'fix'],
      properties: { severity: { type: 'string', enum: ['P0', 'P1', 'P2', 'P3'] }, element: { type: 'string' }, fix: { type: 'string' } } } },
    explanation: { type: 'string' },
  },
};

const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'design-judge-'));
fs.writeFileSync(path.join(cwd, 'system.txt'), RUBRIC);
fs.writeFileSync(path.join(cwd, 'schema.json'), JSON.stringify(SCHEMA));
const ask = (c) => `Product: ${CONTEXT}\n\n${c.platform ? `Platform: ${c.platform}\n\n` : ''}This screen: ${c.purpose}\n\nGrade the screenshot.`;

function run(cmd, argv, input, timeoutMs = 300_000) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, argv, { cwd, windowsHide: true, shell: process.platform === 'win32' && JUDGE === 'codex' });
    let out = '', err = '';
    const timer = setTimeout(() => child.kill(), timeoutMs);
    child.stdout.on('data', d => out += d); child.stderr.on('data', d => err += d);
    child.on('error', reject);
    child.on('close', () => { clearTimeout(timer); resolve({ out, err }); });
    child.stdin.on('error', () => {});
    child.stdin.end(input);
  });
}

async function judgeClaude(c, png) {
  const msg = { type: 'user', message: { role: 'user', content: [
    { type: 'text', text: ask(c) },
    { type: 'image', source: { type: 'base64', media_type: 'image/png', data: fs.readFileSync(png).toString('base64') } },
  ] } };
  const { out, err } = await run('claude', ['-p', '--model', MODEL, '--input-format', 'stream-json', '--output-format', 'stream-json', '--verbose',
    '--json-schema', JSON.stringify(SCHEMA), '--tools', '', '--strict-mcp-config', '--no-session-persistence', '--disable-slash-commands',
    '--settings', '{"disableAllHooks":true}', '--system-prompt-file', path.join(cwd, 'system.txt'), '--max-turns', '3'], JSON.stringify(msg) + '\n');
  const r = out.split(/\r?\n/).map(l => { try { return JSON.parse(l); } catch { return null; } }).find(j => j?.type === 'result');
  if (!r || r.is_error || !r.structured_output) throw new Error((r?.result || err || out).slice(0, 300));
  return { g: r.structured_output, cost: +r.total_cost_usd || 0 };
}

async function judgeCodex(c, png) {
  const outFile = path.join(cwd, `out-${c.id}-${Math.random().toString(36).slice(2)}.json`);
  const argv = ['exec', '--skip-git-repo-check', '--ephemeral', '-s', 'read-only', '-C', cwd, '-i', path.resolve(png),
    '--output-schema', path.join(cwd, 'schema.json'), '-o', outFile, ...(MODEL ? ['-m', MODEL] : []), '-'];
  const { err } = await run('codex', argv, `${RUBRIC}\n\n---\n\n${ask(c)}\nAnswer only with the JSON object.`);
  if (!fs.existsSync(outFile)) throw new Error(err.slice(-300));
  const text = fs.readFileSync(outFile, 'utf8');
  return { g: JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)), cost: 0 }; // plan usage; no per-call price reported
}

// One number to climb: Nielsen, checklist and the overall verdict count equally (0-100).
function score(g) {
  const nielsen = H.reduce((s, h) => s + g.heuristics[h], 0);
  const checklist = C.filter(c => g.checklist[c]).length / C.length;
  return { ux: Math.round((nielsen / 40 + checklist + g.overall / 10) / 3 * 1000) / 10, nielsen, checklist: Math.round(checklist * 1000) / 10, overall: g.overall };
}

const resFile = path.join(dir, 'results.jsonl');
const done = new Set(fs.existsSync(resFile) ? fs.readFileSync(resFile, 'utf8').split('\n').filter(Boolean).map(l => { const j = JSON.parse(l); return `${j.case_id}#${j.rep}`; }) : []);
const todo = CASES.filter(c => SPLIT === 'all' || c.split === SPLIT)
  .flatMap(c => [...Array(REPS).keys()].map(rep => ({ c, rep }))).filter(({ c, rep }) => !done.has(`${c.id}#${rep}`));
console.log(`${todo.length} gradings to run · judge ${JUDGE}${MODEL ? ' ' + MODEL : ''}`);

let spent = 0;
async function worker() {
  for (let job; (job = todo.shift());) {
    const { c, rep } = job;
    const png = path.join(dir, 'shots', `${c.id}.png`);
    if (!fs.existsSync(png)) { console.log(`${c.id} MISSING ${png}`); continue; }
    const t0 = Date.now();
    try {
      const { g, cost } = await (JUDGE === 'claude' ? judgeClaude : judgeCodex)(c, png);
      spent += cost;
      const s = score(g);
      const failed = C.filter(k => !g.checklist[k]).join(', ') || 'none';
      const issues = g.issues.map(i => `[${i.severity}] ${i.element}: ${i.fix}`).join('\n');
      fs.appendFileSync(resFile, JSON.stringify({ case_id: c.id, split: c.split, rep, scores: s, model: MODEL || JUDGE,
        explanation: { ux: `${g.explanation}\n\nFailed checks: ${failed}\n${issues}` }, raw: g,
        perf: { cost_usd: cost, latency_s: (Date.now() - t0) / 1000 } }) + '\n');
      console.log(`${c.id}#${rep} ux=${s.ux} nielsen=${s.nielsen}/40 checks=${s.checklist}% overall=${s.overall}${spent ? `  ($${spent.toFixed(2)})` : ''}`);
    } catch (e) { console.log(`${c.id}#${rep} FAILED ${e.message}`); }
  }
}
await Promise.all([...Array(JOBS)].map(worker));

const rows = fs.existsSync(resFile) ? fs.readFileSync(resFile, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)) : [];
const mean = (xs) => Math.round(xs.reduce((a, b) => a + b, 0) / xs.length * 10) / 10;
const summary = {};
for (const sp of ['train', 'test']) {
  const r = rows.filter(x => x.split === sp);
  if (r.length) summary[sp] = { n: r.length, ux: mean(r.map(x => x.scores.ux)), nielsen: mean(r.map(x => x.scores.nielsen)), checklist: mean(r.map(x => x.scores.checklist)), overall: mean(r.map(x => x.scores.overall)) };
}
summary.cost_usd = Math.round(rows.reduce((a, x) => a + (x.perf?.cost_usd || 0), 0) * 100) / 100;
fs.writeFileSync(path.join(dir, 'summary.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary));
