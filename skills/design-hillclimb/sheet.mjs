// Contact sheet of a version's screenshots (train and test), for the user to sign off on the inputs.
// node sheet.mjs <flowDir> <version>   -> <flowDir>/<version>/screens.html
import fs from 'node:fs';
import path from 'node:path';

const [flow, version] = process.argv.slice(2);
const cases = JSON.parse(fs.readFileSync(path.join(flow, 'cases.json'), 'utf8'));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const card = c => {
  const p = path.join(flow, version, 'shots', `${c.id}.png`);
  const img = fs.existsSync(p) ? `<img src="data:image/png;base64,${fs.readFileSync(p).toString('base64')}" alt="">` : '<div class="miss">missing</div>';
  return `<figure>${img}<figcaption><b>${esc(c.id)}</b> <span class="${c.split}">${c.split}</span><br>${esc(c.purpose)}</figcaption></figure>`;
};
const html = `<!doctype html><meta charset=utf-8><title>Hillclimb screens</title><style>
body{font-size:13px}h2{margin:18px 0 8px}.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:14px}
img{width:100%;border-radius:8px;border:1px solid var(--border,#444)}figure{margin:0}.test{color:var(--warning,#c90)}.train{color:var(--info,#39f)}.miss{padding:40px;text-align:center;border:1px dashed}</style>
<h2>Train (${cases.filter(c => c.split === 'train').length}): read and tuned on</h2><div class="g">${cases.filter(c => c.split === 'train').map(card).join('')}</div>
<h2>Test (${cases.filter(c => c.split === 'test').length}): held back, only scored</h2><div class="g">${cases.filter(c => c.split === 'test').map(card).join('')}</div>`;
const out = path.join(flow, version, 'screens.html');
fs.writeFileSync(out, html);
console.log(out);
