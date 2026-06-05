
const STORAGE_KEY = 'crimson-carriage-v3';
let caseData;
let state = { view: 'locations', clues: [], hintsUsed: 0, contrast: false };
const $ = (s) => document.querySelector(s);

function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); $('#saveStatus').textContent = 'Autosaved ' + new Date().toLocaleTimeString(); }
function load(){ try{ state = {...state, ...JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}; }catch{} if(state.contrast) document.body.classList.add('high'); }
function hasClue(id){ return state.clues.includes(id); }
function addClue(id){ if(!hasClue(id)){ state.clues.push(id); save(); } }
function clueById(id){ return caseData.clues.find(c=>c.id===id); }
function suspectById(id){ return caseData.suspects.find(s=>s.id===id); }
function setView(view){ state.view=view; save(); render(); }
function availableQuestion(q){ return (q.requires||[]).every(hasClue); }

async function init(){
  caseData = await fetch('data/case-crimson-carriage.json?v=3').then(r=>r.json());
  load();
  $('#tagline').textContent = caseData.meta.tagline;
  renderBriefing();
  $('#howList').innerHTML = caseData.howToPlay.map(x=>`<li>${x}</li>`).join('');
  $('#briefingBtn').onclick=()=>document.getElementById('caseBriefing').scrollIntoView({behavior:'smooth'});
  $('#startBtn').onclick=()=>setView('locations');
  $('#howBtn').onclick=()=>document.getElementById('intro').scrollIntoView({behavior:'smooth'});
  $('#contrastBtn').onclick=()=>{ state.contrast=!state.contrast; document.body.classList.toggle('high', state.contrast); save(); };
  $('#resetBtn').onclick=()=>{ if(confirm('Reset this investigation?')){ localStorage.removeItem(STORAGE_KEY); location.reload(); } };
  document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>setView(b.dataset.view));
  if('serviceWorker' in navigator){ navigator.serviceWorker.register('sw.js?v=3').catch(console.warn); }
  render();
}


function renderBriefing(){
  const b = caseData.briefing;
  if(!b) return;
  $('#briefingHeadline').textContent = b.headline;
  $('#briefingOpening').textContent = b.opening;
  $('#briefingIncident').textContent = b.incident;
  $('#briefingRole').textContent = b.role;
  $('#briefingStakes').textContent = b.stakes;
  $('#knownFacts').innerHTML = b.knownFacts.map(f=>`<li>${f}</li>`).join('');
  $('#firstMove').textContent = b.firstMove;
  const v = b.victimCard;
  $('#victimCard').innerHTML = `
    <dt>Name</dt><dd>${v.name}</dd>
    <dt>Role</dt><dd>${v.role}</dd>
    <dt>Found</dt><dd>${v.found}</dd>
    <dt>Cause</dt><dd>${v.cause}</dd>
    <dt>Last words</dt><dd>${v.lastWords}</dd>`;
}

function render(){
  document.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('active', b.dataset.view===state.view));
  const view = $('#view');
  if(state.view==='locations') view.innerHTML = renderLocations();
  if(state.view==='suspects') view.innerHTML = renderSuspects();
  if(state.view==='timeline') view.innerHTML = renderTimeline();
  if(state.view==='notebook') view.innerHTML = renderNotebook();
  if(state.view==='accuse') view.innerHTML = renderAccuse();
  if(state.view==='host') view.innerHTML = renderHostKit();
  wireDynamic();
}

function renderLocations(){
  return `<h2>Search the train</h2><p class="muted">Each train car contains public clues. Some clue details unlock better suspect questions.</p><div class="card-grid">${caseData.locations.map(loc=>`<article class="card location" data-loc="${loc.id}"><div class="icon">${loc.icon}</div><h3>${loc.name}</h3><p>${loc.description}</p><div>${loc.clueIds.map(id=>`<span class="badge">${hasClue(id)?'✓':'?'} ${clueById(id).title}</span>`).join('')}</div></article>`).join('')}</div>`;
}
function renderLocationDetail(id){
  const loc=caseData.locations.find(l=>l.id===id);
  $('#view').innerHTML = `<button class="secondary" data-back="locations">← Back</button><h2>${loc.icon} ${loc.name}</h2><p>${loc.description}</p><div class="clues">${loc.clueIds.map(cid=>{const c=clueById(cid); const locked=(c.prereqIds||[]).some(p=>!hasClue(p)); return `<article class="clue ${c.type} ${locked?'locked':''}"><h3>${c.title}</h3><p>${locked?'You sense this matters, but need another clue first: '+c.prereqIds.map(p=>clueById(p).title).join(', '):c.text}</p><button ${locked?'disabled':''} data-clue="${c.id}">${hasClue(c.id)?'Collected':'Collect clue'}</button></article>`}).join('')}</div>`;
  wireDynamic();
}
function renderSuspects(){
  return `<h2>Question suspects</h2><p class="muted">Public cards avoid spoiler fields. Follow-up questions unlock from clues.</p><div class="card-grid">${caseData.suspects.map(s=>`<article class="card suspect" data-suspect="${s.id}"><div class="icon">${s.avatar}</div><h3>${s.name}</h3><p><strong>${s.role}</strong></p><p>${s.public.bio}</p><p class="muted"><strong>Alibi:</strong> ${s.public.alibi}</p><span class="badge">Suspicious: ${s.public.suspicious}</span></article>`).join('')}</div>`;
}
function renderSuspectDetail(id){
  const s=suspectById(id);
  $('#view').innerHTML = `<button class="secondary" data-back="suspects">← Back</button><h2>${s.avatar} ${s.name}</h2><p><strong>${s.role}</strong></p><p>${s.public.bio}</p><p><strong>Alibi:</strong> ${s.public.alibi}</p><h3>Questions</h3>${s.questions.map(q=>`<button class="question ${availableQuestion(q)?'':'locked'}" ${availableQuestion(q)?'':'disabled'} data-answer="${s.id}|${q.id}">${q.label}${availableQuestion(q)?'':' — locked'}</button>`).join('')}<div id="answerBox" class="result" hidden></div>`;
  wireDynamic();
}
function renderTimeline(){
  return `<h2>Timeline map</h2><p class="muted">New research pushed this case toward a stronger movement/timetable puzzle.</p><div class="timeline">${caseData.timeline.map(t=>`<div class="timeline-item"><strong>${t.time}</strong><p>${t.event}</p><div>${t.suspectIds.map(id=>`<span class="badge">${suspectById(id).name}</span>`).join('')}</div></div>`).join('')}</div>`;
}
function renderNotebook(){
  const collected=caseData.clues.filter(c=>hasClue(c.id));
  return `<h2>Detective notebook</h2><p><span class="notebook-count">${collected.length}/${caseData.clues.length}</span> clues collected. Hints used: ${state.hintsUsed}.</p><button id="hintBtn" class="secondary" ${state.hintsUsed>=caseData.hints.length?'disabled':''}>Use hint</button><div class="clues">${collected.map(c=>`<article class="clue ${c.type}"><h3>${c.title}</h3><p>${c.text}</p><span class="badge">${c.job}</span><span class="badge">${c.type}</span></article>`).join('') || '<p class="muted">No clues yet. Search the train cars.</p>'}</div>`;
}
function renderAccuse(){
  const suspectOptions=caseData.suspects.map(s=>`<option value="${s.id}">${s.name}</option>`).join('');
  const clueOptions=caseData.clues.filter(c=>hasClue(c.id)).map(c=>`<label><input type="checkbox" value="${c.id}"> ${c.title}</label>`).join('') || '<p class="muted">Collect clues before submitting evidence.</p>';
  return `<h2>Final accusation</h2><p class="muted">Structured accusation = easier for family testers and lets the app score fairly.</p><div class="form-grid"><label>Killer<select id="killer">${suspectOptions}</select></label><label>Method<select id="method"><option value="sugar-tongs">Poisoned sugar tongs</option><option value="tea-caddy">Poisoned tea caddy</option><option value="almond-dessert">Almond dessert</option><option value="pocket-needle">Pocket needle</option></select></label><label>Opportunity<select id="opp"><option value="observation-platform">Observation platform/service door</option><option value="sleeping-car">Sleeping car corridor</option><option value="galley">Galley preparation</option><option value="conductor-office">Conductor office</option></select></label></div><h3>Evidence</h3><div class="choices">${clueOptions}</div><button id="submitAccuse">Reveal verdict</button><div id="verdict" class="result" hidden></div>`;
}
function renderHostKit(){
  return `<h2>Host / dinner-party kit</h2><p class="muted">Research effect: this case includes a simple host pack, not just a solo screen.</p><div class="host">Title: ${caseData.meta.title}
Victim: ${caseData.meta.victim}
Loop: ${caseData.meta.loop}

Suggested live reveal:
1. Let everyone name a suspect.
2. Ask for the one clue that changed their mind.
3. Read the final reveal only after accusations.

Do not show this solution before play:
${caseData.solution.reveal}</div>`;
}
function wireDynamic(){
  document.querySelectorAll('[data-loc]').forEach(el=>el.onclick=()=>renderLocationDetail(el.dataset.loc));
  document.querySelectorAll('[data-suspect]').forEach(el=>el.onclick=()=>renderSuspectDetail(el.dataset.suspect));
  document.querySelectorAll('[data-back]').forEach(el=>el.onclick=()=>setView(el.dataset.back));
  document.querySelectorAll('[data-clue]').forEach(el=>el.onclick=()=>{ addClue(el.dataset.clue); el.textContent='Collected'; el.disabled=true; });
  document.querySelectorAll('[data-answer]').forEach(el=>el.onclick=()=>{const [sid,qid]=el.dataset.answer.split('|'); const s=suspectById(sid); const q=s.questions.find(x=>x.id===qid); const box=$('#answerBox'); box.hidden=false; box.innerHTML=`<h3>${q.label}</h3><p>${q.answer}</p>`; (q.unlocks||[]).forEach(addClue);});
  const hint=$('#hintBtn'); if(hint) hint.onclick=()=>{ alert(caseData.hints[state.hintsUsed]); state.hintsUsed++; save(); render(); };
  const submit=$('#submitAccuse'); if(submit) submit.onclick=scoreAccusation;
}
function scoreAccusation(){
  const selected=[...document.querySelectorAll('.choices input:checked')].map(i=>i.value);
  const s=caseData.solution;
  let score=0, parts=[];
  if($('#killer').value===s.killerId){score++; parts.push('Killer correct');} else parts.push('Killer incorrect');
  if($('#method').value===s.methodId){score++; parts.push('Method correct');} else parts.push('Method incorrect');
  if($('#opp').value===s.opportunityId){score++; parts.push('Opportunity correct');} else parts.push('Opportunity incorrect');
  const required=s.requiredClueIds.filter(id=>selected.includes(id)).length;
  if(required>=4){score++; parts.push('Evidence strong');} else parts.push(`Evidence weak: ${required}/${s.requiredClueIds.length} decisive clues selected`);
  const rating = score===4 && state.hintsUsed===0 ? 'Master Detective' : score>=3 ? 'Sharp Investigator' : 'Needs another pass';
  const box=$('#verdict'); box.hidden=false; box.innerHTML=`<h3>${rating}: ${score}/4</h3><p>${parts.join(' • ')}</p><p><strong>Reveal:</strong> ${s.reveal}</p>`;
}
init().catch(err=>{ document.body.innerHTML='<pre>App failed: '+err.message+'</pre>'; console.error(err); });
