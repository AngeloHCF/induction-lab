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
    <div class="card-actions"><button class="solution-toggle" aria-expanded="false" aria-controls="solution-${p.id}" data-toggle="${p.id}"><span>Show Solution</span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 8 5 5 5-5"/></svg></button><label class="complete-label"><input type="checkbox" data-complete="${p.id}" aria-label="Mark problem ${p.id} complete"><span>Mark complete</span></label></div>
    <section class="solution" id="solution-${p.id}" aria-label="Solution to problem ${p.id}" hidden>${p.stages.map((s,i) => `<div class="stage"><h3><span class="stage-number" aria-hidden="true">${String(i+1).padStart(2,'0')}</span>${s.label}</h3>${math(s.math)}</div>`).join('')}</section>
  </article>`;
}).join('\n');
const index = problems.map(p => `<button data-jump="${p.id}" title="${escape(p.title)}" aria-label="Go to problem ${p.id}: ${escape(p.title)}">${String(p.id).padStart(2,'0')}</button>`).join('');
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#153c35"><meta name="description" content="50 induction challenges, from first principles to unfamiliar identities. Complete proofs stay hidden until you choose to see them."><title>Induction Atelier · 50 mathematical challenges</title><link rel="icon" href="favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="vendor/katex.min.css"><link rel="stylesheet" href="style.css"><script src="app.js" defer></script></head>
<body><a class="skip" href="#collection">Skip to problems</a>
<header class="masthead"><a class="brand" href="#"><span class="brand-mark" aria-hidden="true">∴</span> INDUCTION <span>ATELIER</span></a><span class="edition">MATHEMATICS / COLLECTION 001</span></header>
<main class="layout"><aside class="sidebar"><div class="sidebar-inner"><div class="eyebrow">YOUR PRACTICE</div><h2>A proof at a time.</h2><div class="progress-heading"><span><strong id="complete-count">0</strong> <span class="muted">/ 50 complete</span></span><span id="percent">0%</span></div><div class="progress-track" role="progressbar" aria-label="Problems completed" aria-valuemin="0" aria-valuemax="50" aria-valuenow="0"><div id="progress-fill"></div></div><p class="save-note" id="save-note">Progress is saved in this browser.</p><button id="next-problem" class="primary">Continue practice <span aria-hidden="true">↗</span></button><div class="index-heading">JUMP TO A PROBLEM<span class="complete-key"><i></i> Complete</span></div><nav class="problem-index" aria-label="Problem navigation">${index}</nav><div class="sidebar-foot"><button id="reset-progress" class="quiet">Reset progress</button><div id="reset-confirm" hidden><p>Clear your completed marks?</p><button id="confirm-reset">Reset</button><button id="cancel-reset">Cancel</button></div></div></div></aside>
<div class="main-column"><section class="hero"><div class="eyebrow"><span class="line"></span> FIFTY CHALLENGES. ONE PRINCIPLE.</div><h1>The induction<br><em>collection.</em></h1><p>From familiar sums to unfamiliar identities.<br>Make the leap. Build the proof.</p><div class="hero-foot"><span class="hidden-note"><svg viewBox="0 0 20 20" aria-hidden="true"><rect x="4" y="8" width="12" height="9" rx="2"/><path d="M7 8V6a3 3 0 0 1 6 0v2"/></svg>Every solution starts hidden.</span><span class="hero-math">${math(String.raw`P(k)\ \Longrightarrow\ P(k+1)`)}</span></div></section>
<section id="collection" aria-label="Problem collection"><div class="collection-heading"><h2>Choose your challenge</h2><button id="hide-solutions" class="quiet">Hide open solutions</button></div><div class="filters"><label class="search-label"><span class="sr-only">Search problems</span><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8" cy="8" r="5"/><path d="m12 12 5 5"/></svg><input id="search" type="search" placeholder="Search problems or topics…"></label><label><span class="sr-only">Difficulty</span><select id="difficulty"><option value="">All difficulties</option>${levels.map(x=>`<option>${x}</option>`).join('')}</select></label><label><span class="sr-only">Topic</span><select id="topic"><option value="">All topics</option>${topics.map(x=>`<option>${x}</option>`).join('')}</select></label><label><span class="sr-only">Progress filter</span><select id="status"><option value="">All progress</option><option value="incomplete">To attempt</option><option value="complete">Completed</option></select></label></div><div class="results-row"><span id="results-count" aria-live="polite">Showing 50 of 50 problems</span><span>Mark complete when you're satisfied with your proof.</span></div><noscript><p class="empty-state">Enable JavaScript to reveal solutions and save progress.</p></noscript><div id="empty-state" class="empty-state" hidden><h3>No matching problems</h3><p>Try another topic or clear your filters.</p><button id="clear-filters">Clear filters</button></div><div id="problem-list">${cards}</div></section>
<footer><span>INDUCTION ATELIER</span><p>50 problems · 200 proof stages · Unlimited scratch paper.</p><a href="#">Back to top ↑</a></footer></div></main><div id="announcement" class="sr-only" role="status" aria-live="polite"></div></body></html>`;
fs.writeFileSync('dist/index.html', html);
fs.mkdirSync('dist/vendor', {recursive:true});
fs.copyFileSync('node_modules/katex/dist/katex.min.css','dist/vendor/katex.min.css');
fs.copyFileSync('node_modules/katex/LICENSE','dist/vendor/KATEX-LICENSE.txt');
fs.cpSync('node_modules/katex/dist/fonts','dist/vendor/fonts',{recursive:true});
console.log(`Built 50 cards, 50 hidden solutions, 200 proof stages; ${rendered} LaTeX expressions rendered without errors.`);
