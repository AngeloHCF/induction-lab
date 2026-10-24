import fs from 'node:fs';
import katex from 'katex';

const problems = JSON.parse(fs.readFileSync('dist/problems.json', 'utf8'));
if (problems.length !== 50) throw new Error('Exactly 50 problems required');
const escape = s => s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
let rendered = 0;
function math(s, extra='') {
  if (!s) return '';
  const html = katex.renderToString(s, {displayMode:true, throwOnError:true, strict:'error', output:'htmlAndMathml'});
  rendered++;
  return `<div class="math ${extra}">${html}</div>`;
}
const levels = ['Foundation','Intermediate','Advanced','Expert'];
const topics = [...new Set(problems.map(p => p.topic))];
const cards = problems.map(p => {
  if (p.stages.map(s => s.label).join('|') !== 'Base Case|Inductive Hypothesis|Inductive Step|Conclusion') throw new Error(`Stages: ${p.id}`);
  return `<article id="problem-${p.id}" class="problem-card" data-id="${p.id}" data-level="${p.difficulty}" data-topic="${p.topic}" data-search="${escape(`${p.id} ${p.title} ${p.topic} ${p.difficulty}`.toLowerCase())}">
    <div class="card-top"><span class="problem-number">${String(p.id).padStart(2,'0')}</span><span class="topic-label">${p.topic}</span><span class="badge ${p.difficulty.toLowerCase()}">${p.difficulty}</span></div>
    <h2 tabindex="-1">${p.title}</h2>
    ${math(p.domain, 'domain')}${math(p.setup, 'setup')}
    <div class="statement">${math(String.raw`P(n):\quad ${p.statement}`)}</div>
    <div class="notes">
      <label for="notes-${p.id}">Notes<span class="sr-only"> for problem ${p.id}</span></label>
      <textarea id="notes-${p.id}" data-notes="${p.id}" rows="4" aria-describedby="notes-status-${p.id}" placeholder="Write your notes, ideas, or proof steps…"></textarea>
      <p class="notes-status" id="notes-status-${p.id}" role="status">Saves automatically in this browser.</p>
    </div>
    <div class="card-actions"><button class="solution-toggle" aria-expanded="false" aria-controls="solution-${p.id}" data-toggle="${p.id}"><span>Show Solution</span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 8 5 5 5-5"/></svg></button><label class="complete-label"><input type="checkbox" data-complete="${p.id}" aria-label="Mark problem ${p.id} complete"><span>Mark complete</span></label></div>
    <section class="solution" id="solution-${p.id}" aria-label="Solution to problem ${p.id}" hidden>${p.stages.map((s,i) => `<div class="stage"><h3><span class="stage-number" aria-hidden="true">${String(i+1).padStart(2,'0')}</span>${s.label}</h3>${math(s.math)}</div>`).join('')}</section>
  </article>`;
}).join('\n');
const index = problems.map(p => `<button data-jump="${p.id}" title="${escape(p.title)}" aria-label="Go to problem ${p.id}: ${escape(p.title)}">${String(p.id).padStart(2,'0')}</button>`).join('');
const replacements = {index, cards, levels: levels.map(x => `<option>${x}</option>`).join(''), topics: topics.map(x => `<option>${x}</option>`).join('')};
const html = fs.readFileSync('page.html', 'utf8').replace(/\{\{(index|cards|levels|topics)\}\}/g, (_, name) => replacements[name]);
fs.writeFileSync('dist/index.html', html);
fs.mkdirSync('dist/vendor', {recursive:true});
fs.copyFileSync('node_modules/katex/dist/katex.min.css','dist/vendor/katex.min.css');
fs.copyFileSync('node_modules/katex/LICENSE','dist/vendor/KATEX-LICENSE.txt');
fs.cpSync('node_modules/katex/dist/fonts','dist/vendor/fonts',{recursive:true});
console.log(`Built 50 cards, 50 hidden solutions, 200 proof stages; ${rendered} LaTeX expressions rendered without errors.`);
