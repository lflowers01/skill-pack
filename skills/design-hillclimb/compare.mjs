// Round report: scores per version, per-screen before/after, noise floor, and what to fix next (train only).
// node compare.mjs <flowDir> [--issues]
import fs from 'node:fs';
import path from 'node:path';

const [flow, ...rest] = process.argv.slice(2);
const versions = fs.readdirSync(flow).filter(v => /^v\d+$/.test(v) && fs.existsSync(path.join(flow, v, 'results.jsonl')))
  .sort((a, b) => +a.slice(1) - +b.slice(1));
if (!versions.length) { console.log('no graded versions yet'); process.exit(0); }
const load = v => fs.readFileSync(path.join(flow, v, 'results.jsonl'), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
const avg = xs => xs.reduce((a, b) => a + b, 0) / xs.length;
const byCase = rows => { const o = {}; rows.forEach(r => (o[r.case_id] ??= { split: r.split, ux: [] }).ux.push(r.scores.ux)); return o; };

console.log('version  train   test');
for (const v of versions) {
  const r = load(v); const f = sp => { const x = r.filter(y => y.split === sp); return x.length ? avg(x.map(y => y.scores.ux)).toFixed(1).padStart(5) : '    -'; };
  console.log(`${v.padEnd(8)} ${f('train')}  ${f('test')}`);
}

const last = versions.at(-1), prev = versions.at(-2);
const L = byCase(load(last)), P = prev ? byCase(load(prev)) : {};
const diffs = Object.values(L).filter(c => c.ux.length >= 2).map(c => Math.abs(c.ux[0] - c.ux[1]));
if (diffs.length) console.log(`\nnoise floor (mean |rep A - rep B| per screen): ${avg(diffs).toFixed(1)}  ·  a split mean moves about ±${(avg(diffs) / Math.sqrt(diffs.length)).toFixed(1)} by chance`);

console.log(`\nper screen ${prev ? prev + ' -> ' : ''}${last}`);
for (const [id, c] of Object.entries(L)) console.log(`  ${c.split.padEnd(5)} ${id.padEnd(24)} ${P[id] ? avg(P[id].ux).toFixed(1) + ' -> ' : ''}${avg(c.ux).toFixed(1)}`);

const train = load(last).filter(r => r.split === 'train');
const fails = {};
train.forEach(r => Object.entries(r.raw.checklist).forEach(([k, ok]) => { if (!ok) fails[k] = (fails[k] || 0) + 1; }));
console.log(`\nfailed checks on train (of ${train.length}): ` + Object.entries(fails).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(', '));

if (rest.includes('--issues')) {
  console.log('\ntop issues (train only, never study test):');
  for (const r of train.filter(r => r.rep === 0)) {
    console.log(`## ${r.case_id}`);
    r.raw.issues.forEach(i => console.log(`  [${i.severity}] ${i.element} -> ${i.fix}`));
  }
}
