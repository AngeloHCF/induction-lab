(() => {
  'use strict';
  const key = 'induction-atelier-progress-v1';
  const notesKey = 'induction-atelier-notes-v1-';
  const cards = [...document.querySelectorAll('.problem-card')];
  const fields = ['search','difficulty','topic','status'].map(id=>document.getElementById(id));
  const completed = new Set();
  const jumpButtons = [...document.querySelectorAll('[data-jump]')];
  const jumpById = new Map(jumpButtons.map(button=>[Number(button.dataset.jump),button]));
  const records = cards.map(card=>({card,id:Number(card.dataset.id),checkbox:card.querySelector('[data-complete]'),label:card.querySelector('.complete-label span'),title:card.querySelector('h2').textContent,jump:jumpById.get(Number(card.dataset.id))}));
  let storageAvailable = true;
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '[]');
    if (Array.isArray(saved)) saved.forEach(id => {if (Number.isInteger(id) && id >= 1 && id <= 50) completed.add(id)});
  } catch { storageAvailable = false; }
  function setNotesStatus(input, message, failed = false) {
    const status = document.getElementById(`notes-status-${input.dataset.notes}`);
    status.textContent = message;
    status.classList.toggle('save-failed', failed);
  }
  document.querySelectorAll('[data-notes]').forEach(input => {
    try {
      const saved = localStorage.getItem(notesKey + input.dataset.notes);
      if (saved !== null) {
        input.value = saved;
        setNotesStatus(input, 'Saved in this browser.');
      }
    } catch {
      setNotesStatus(input, 'Could not load saved notes from this browser.', true);
    }
  });
  document.addEventListener('input', event => {
    const input = event.target.closest('[data-notes]');
    if (!input) return;
    try {
      localStorage.setItem(notesKey + input.dataset.notes, input.value);
      setNotesStatus(input, 'Saved in this browser.');
    } catch {
      setNotesStatus(input, 'Could not save. Keep this page open to keep your notes.', true);
    }
  });
  function announce(s) {document.getElementById('announcement').textContent=s}
  function save() {
    try { localStorage.setItem(key,JSON.stringify([...completed]));storageAvailable=true; }
    catch {storageAvailable=false}
    document.getElementById('save-note').textContent=storageAvailable?'Progress is saved in this browser.':'Progress is kept for this session only.';
  }
  function updateProgress() {
    const count=completed.size;
    document.getElementById('complete-count').textContent=count;
    document.getElementById('percent').textContent=`${count*2}%`;
    document.getElementById('progress-fill').style.width=`${count*2}%`;
    document.querySelector('[role=progressbar]').setAttribute('aria-valuenow',count);
    records.forEach(({card,id,checkbox,label,title,jump})=>{
      const done=completed.has(id);
      card.classList.toggle('completed',done);
      checkbox.checked=done;
      label.textContent=done?'Completed':'Mark complete';
      jump.classList.toggle('done',done);
      jump.setAttribute('aria-label',`Go to problem ${id}${done?', completed':''}: ${title}`);
    });
    const next=document.getElementById('next-problem');
    next.innerHTML=count===50?'All 50 complete <span aria-hidden="true">✓</span>':'Continue practice <span aria-hidden="true">↗</span>';
    next.disabled=count===50;
  }
  function filter() {
    const [search,level,topic,status]=fields.map(f=>f.value.toLowerCase().trim());
    let shown=0;
    cards.forEach(card=>{
      const done=completed.has(Number(card.dataset.id));
      const match=(!search||card.dataset.search.includes(search))&&(!level||card.dataset.level.toLowerCase()===level)&&(!topic||card.dataset.topic.toLowerCase()===topic)&&(!status||(status==='complete'?done:!done));
      card.hidden=!match;
      if(match)shown++;
    });
    document.getElementById('results-count').textContent=`Showing ${shown} of 50 problems`;
    document.getElementById('empty-state').hidden=shown!==0;
  }
  function clearFilters(){fields.forEach(f=>f.value='');filter()}
  function fitMath(root) {
    root.querySelectorAll('.math').forEach(el=>{
      if(el.scrollWidth>el.clientWidth+2){el.tabIndex=0;el.setAttribute('aria-label','Mathematical expression; scroll horizontally to see more')}
      else {el.removeAttribute('tabindex');el.removeAttribute('aria-label')}
    });
  }
  function setExpanded(button,expanded) {
    button.setAttribute('aria-expanded',String(expanded));
    button.querySelector('span').textContent=expanded?'Hide Solution':'Show Solution';
    const section=document.getElementById(button.getAttribute('aria-controls'));
    section.hidden=!expanded;
    if(expanded)fitMath(section);
  }
  function jump(id) {
    clearFilters();
    const card=document.getElementById(`problem-${id}`);
    card.querySelector('h2').focus({preventScroll:true});
    card.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    jumpButtons.forEach(b=>b.classList.toggle('current',Number(b.dataset.jump)===id));
  }
  document.addEventListener('click',event=>{
    const toggle=event.target.closest('[data-toggle]');
    if(toggle)setExpanded(toggle,toggle.getAttribute('aria-expanded')!=='true');
    const nav=event.target.closest('[data-jump]');
    if(nav)jump(Number(nav.dataset.jump));
  });
  document.addEventListener('change',event=>{
    const checkbox=event.target.closest('[data-complete]');
    if(!checkbox)return;
    const id=Number(checkbox.dataset.complete);
    if(checkbox.checked)completed.add(id);else completed.delete(id);
    save();updateProgress();filter();announce(`Problem ${id} ${checkbox.checked?'completed':'marked incomplete'}. ${completed.size} of 50 complete.`);
  });
  fields.forEach(f=>f.addEventListener(f.type==='search'?'input':'change',filter));
  document.getElementById('clear-filters').addEventListener('click',clearFilters);
  document.getElementById('hide-solutions').addEventListener('click',()=>{document.querySelectorAll('[data-toggle]').forEach(b=>setExpanded(b,false));announce('All solutions hidden.')});
  document.getElementById('next-problem').addEventListener('click',()=>{const card=cards.find(c=>!completed.has(Number(c.dataset.id)));if(card)jump(Number(card.dataset.id))});
  const confirm=document.getElementById('reset-confirm');
  document.getElementById('reset-progress').addEventListener('click',()=>{confirm.hidden=false;document.getElementById('cancel-reset').focus()});
  document.getElementById('cancel-reset').addEventListener('click',()=>{confirm.hidden=true;document.getElementById('reset-progress').focus()});
  document.getElementById('confirm-reset').addEventListener('click',()=>{completed.clear();save();updateProgress();filter();confirm.hidden=true;document.getElementById('reset-progress').focus();announce('Progress reset.')});
  updateProgress();filter();
  if(!storageAvailable)document.getElementById('save-note').textContent='Progress is kept for this session only.';
  document.fonts.ready.then(()=>fitMath(document));
  window.addEventListener('resize',()=>fitMath(document));
})();
