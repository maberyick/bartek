/* FlowSuite — generic AI/LLM pipeline orchestrator demo. Synthetic data. Violet theme. */
(function(){
const AC='#a78bfa'; // violet
(function injectCSS(){const css=`
 .modal-bk{position:fixed;inset:0;background:rgba(10,8,20,.72);display:none;align-items:flex-start;justify-content:center;padding:30px 16px;overflow:auto;z-index:9999}
 .modal-bk.open{display:flex}
 .modal-card{background:#161226;border:1px solid #33285a;border-radius:16px;padding:20px;max-width:840px;width:100%;position:relative;color:#eae7f6}
 .modal-x{position:absolute;top:12px;right:14px;background:#241c40;border:0;color:#d7cfee;width:30px;height:30px;border-radius:8px;font-size:18px;cursor:pointer}
 .modal-head{font-size:16px;display:flex;align-items:center;gap:10px;margin-bottom:14px}.modal-head b{color:#fff}
 .riskcard{background:linear-gradient(180deg,#181330,#120e26);border:1px solid #33285a;border-radius:14px;padding:16px}
 .rc-head{font-size:12px;text-transform:uppercase;letter-spacing:.6px;color:#a99fce;margin-bottom:10px}
 .rc-body{display:flex;gap:20px;align-items:center;flex-wrap:wrap}.rc-stats{display:flex;gap:14px;flex-wrap:wrap;flex:1}
 .rc-tile{background:#120e26;border:1px solid #33285a;border-radius:11px;padding:10px 14px;min-width:120px}
 .rc-tile .t{font-size:11px;color:#a99fce;text-transform:uppercase}.rc-tile .v{font-size:24px;font-weight:800;color:#fff;line-height:1.1;margin-top:2px}.rc-tile .s{font-size:11.5px;color:#a99fce}
 .rc-note{font-size:11.5px;color:#a99fce;margin-top:12px;border-top:1px solid #241c40;padding-top:8px}
 .repgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px}
 .repcard{background:#181330;border:1px solid #33285a;border-radius:12px;padding:13px;cursor:pointer}.repcard:hover{border-color:${AC}}
 .repcard .top{display:flex;align-items:center;gap:8px;font-size:13.5px}
 .riskbadge{display:inline-block;margin-top:8px;border:1px solid #33285a;border-radius:8px;padding:4px 10px;font-size:12px;font-weight:800}
 .viewer{display:grid;grid-template-columns:1fr 220px;gap:14px}@media(max-width:640px){.viewer{grid-template-columns:1fr}}
 .canvas{background:#0e0b1c;border-radius:10px;overflow:hidden;padding:12px}
 .doc{font-size:12.5px;line-height:1.7;color:#cfc8e6}.doc .hl{border-radius:4px;padding:1px 4px;color:#0e0b1c;font-weight:700}
 .hl.p{background:#a78bfa}.hl.b{background:#60a5fa}.hl.g{background:#34d399}.hl.a{background:#fbbf24}.hl.r{background:#f87171}
 .json{background:#0b0917;border:1px solid #241c40;border-radius:8px;padding:10px;font-size:11.5px;color:#b9f2d6;margin-top:10px;white-space:pre-wrap;font-family:ui-monospace,Menlo,monospace}
 .metric{display:flex;justify-content:space-between;font-size:13px;padding:6px 0;border-bottom:1px solid #241c40}.metric b{color:#fff}
 .tog{display:flex;gap:8px;margin-top:8px}.tog button{flex:1;font-size:12px;padding:6px;border:1px solid #33285a;background:#120e26;color:#c3b9e4;border-radius:7px;cursor:pointer}.tog button.on{background:${AC};color:#0e0b1c;border-color:${AC}}
 .backbtn{display:block;text-align:center;background:#241c40;border:1px solid #33285a;color:#d7cfee;border-radius:9px;padding:9px;margin-bottom:12px;cursor:pointer;font-size:13px;font-weight:600}.backbtn:hover{border-color:${AC};color:#fff}`;
 const s=document.createElement('style');s.textContent=css;document.head.appendChild(s);})();

const $=s=>document.querySelector(s),main=()=>document.getElementById('main');
const R=(a,b)=>a+Math.random()*(b-a),RI=(a,b)=>Math.floor(R(a,b+1)),pick=a=>a[RI(0,a.length-1)];
const esc=s=>String(s).replace(/[<>&]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]));

const JOBS=[
  {id:'JOB-8801',kind:'contracts · 240 docs',sel:true},
  {id:'JOB-8802',kind:'support tickets · 1.2k',sel:true},
  {id:'JOB-8803',kind:'invoices · 480 docs',sel:false},
  {id:'JOB-8804',kind:'research PDFs · 96 docs',sel:false},
];
const MODULES=[
  {id:'rag',name:'RAG Retrieval',role:'Grounded context retrieval',kw:['rag','retrieve','ground','search','context']},
  {id:'pii',name:'PII Redaction',role:'Mask sensitive data',kw:['pii','redact','mask','privacy','sensitive']},
  {id:'extract',name:'Structured Extraction',role:'Pull fields into JSON',kw:['extract','field','structured','json','key term']},
  {id:'classify',name:'Classification',role:'Label / route each item',kw:['classify','label','route','categor','triage']},
  {id:'guardrails',name:'Guardrails',role:'Validate + safety checks',kw:['guardrail','validate','safety','check','hallucin','risk','flag']},
];
const SPINE=[['ingest','Ingest'],['chunk','Chunk'],['retrieve','Retrieve'],['llm','LLM inference'],['qc','Guardrails'],['deliver','Deliver']];
const EXAMPLES=['Extract key terms and flag risky clauses','Summarize and classify support tickets','Redact PII, then extract structured fields','Just run the core extraction pipeline'];
let view='new',plan=null,streaming=false,runs=[];

function planPipeline(text){const t=(text||'').toLowerCase();
  const mods=MODULES.filter(m=>m.kw.some(k=>t.includes(k)));
  if(!mods.find(m=>m.id==='guardrails'))mods.push(MODULES[4]); // guardrails always
  const model='LLM-FT (fine-tuned)',reasoning=[];
  reasoning.push(`Parsed your goal: “${(text||'extract fields + guardrails').trim()}”.`);
  reasoning.push(`Core spine: ingest → chunk → embed/retrieve (RAG) → ${model} inference → guardrails → deliver.`);
  reasoning.push(`Recommended model: a ${model} on your domain — a fine-tuned small model beats a big general one on cost + accuracy for repetitive extraction.`);
  mods.forEach(m=>reasoning.push(`Adding ${m.name} — ${m.role} — based on your goal.`));
  reasoning.push(`Params: 512-token chunks, top-k=6 retrieval, JSON-schema-constrained output, self-check pass. Est. ~${RI(2,9)}k tokens/doc.`);
  return {model,modules:mods,reasoning,params:'512-tok chunks · top-k 6 · schema-constrained',_text:text};
}

const QCOL=q=>q>=0.8?'#34d399':q>=0.55?'#fbbf24':'#f87171';
const QLAB=q=>q>=0.8?'high':q>=0.55?'medium':'low';
function gauge(score,label,col){const W=180,H=104,cx=90,cy=94,r=74;
  const pt=f=>[cx+Math.cos(Math.PI*(1-f))*r,cy-Math.sin(Math.PI*(1-f))*r];
  const arc=(a,b,c)=>{const[x1,y1]=pt(a),[x2,y2]=pt(b);return `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} A${r} ${r} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="${c}" stroke-width="11" stroke-linecap="round"/>`;};
  const[px,py]=pt(score);
  return `<svg viewBox="0 0 ${W} ${H}" width="176">${arc(0,0.5,'#f87171')}${arc(0.51,0.79,'#fbbf24')}${arc(0.8,1,'#34d399')}
   <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="8" fill="#120e26" stroke="${col}" stroke-width="4"/>
   <text x="${cx}" y="${cy-16}" text-anchor="middle" fill="#fff" font-size="26" font-weight="800">${score.toFixed(2)}</text>
   <text x="${cx}" y="${cy}" text-anchor="middle" fill="${col}" font-size="12" font-weight="800">${label.toUpperCase()}</text></svg>`;}
function qualityCard(r){const col=QCOL(r.quality);
  return `<div class="riskcard"><div class="rc-head"><i class="fa-solid fa-gauge-high" style="color:${col}"></i> Output quality — confidence · accuracy · cost</div>
   <div class="rc-body">${gauge(r.quality,QLAB(r.quality)+' conf',col)}
    <div class="rc-stats">
     <div class="rc-tile"><div class="t">Confidence</div><div class="v" style="color:${col}">${QLAB(r.quality)}</div><div class="s">self-check ${r.quality.toFixed(2)}</div></div>
     <div class="rc-tile"><div class="t">Fields extracted</div><div class="v">${r.fields}</div><div class="s">${r.flags} risk flags</div></div>
     <div class="rc-tile"><div class="t">Est. cost</div><div class="v">$${r.cost}</div><div class="s">${r.tokens}k tokens · ${r.acc}% acc</div></div>
    </div></div>
   <div class="rc-note">Synthetic output. In production, a schema-constrained fine-tuned LLM + guardrails produce validated, auditable results at a fraction of big-model cost.</div></div>`;}

function docView(hl){
  const S=(t,c)=>hl?`<span class="hl ${c}">${t}</span>`:t;
  const doc=`This Master Services Agreement is entered into between ${S('Acme Corp','p')} and ${S('Bartek LLC','b')}, effective ${S('Jan 1, 2026','g')}. Total contract value is ${S('$'+RI(80,480)+'k','a')}. Either party may terminate with ${S('30 days notice','r')}. Liability is ${S('capped at fees paid','r')}. The term ${S('auto-renews annually','r')} unless cancelled.`;
  const json=hl?`<pre class="json">{
  "party_a": "Acme Corp",
  "party_b": "Bartek LLC",
  "effective_date": "2026-01-01",
  "value_usd": ${RI(80,480)}000,
  "termination_notice": "30 days",
  "risk_flags": ["liability cap", "auto-renew"]
}</pre>`:'';
  return `<div class="doc">${doc}</div>${json}`;
}

function selJobs(){return JOBS.filter(s=>s.sel);}
function newView(){return `<div class="h1">Start a new run</div>
  <div class="sub">Describe the task in plain English — the Assistant plans the LLM pipeline, or configure it yourself.</div>
  <div class="card asst"><div class="head"><i class="fa-solid fa-wand-magic-sparkles"></i> Pipeline Assistant</div>
   <textarea id="obj" placeholder="e.g. Extract key terms and flag risky clauses...">${esc(plan?plan._text:'')}</textarea>
   <div class="chips" id="ex">${EXAMPLES.map(e=>`<span class="chip">${e}</span>`).join('')}</div>
   <div style="margin-top:12px"><button class="btn" id="ask"><i class="fa-solid fa-robot"></i> Ask the Assistant to plan it</button></div>
   <div id="planout" style="margin-top:14px"></div></div>
  <div class="card"><h3>Input jobs (${JOBS.length}) — ${selJobs().length} selected</h3>
   ${JOBS.map((s,i)=>`<label class="slide"><input type="checkbox" data-i="${i}" ${s.sel?'checked':''}> <b>${s.id}</b> <span class="meta">${s.kind}</span></label>`).join('')}</div>
  <div class="card"><h3>Pipeline modules (optional)</h3>
   <div class="chips" id="mods">${MODULES.map(m=>`<span class="chip ${plan&&plan.modules.find(x=>x.id===m.id)?'on':''}" data-m="${m.id}">${m.name}</span>`).join('')}</div>
   <div class="sub" style="margin:10px 0 0">Core spine (chunk → retrieve → LLM → guardrails) always runs.</div></div>
  <button class="btn" id="start" ${plan?'':'disabled'} style="font-size:15px;padding:13px 22px"><i class="fa-solid fa-play"></i> Start batch pipeline (${selJobs().length} jobs)</button>`;}
function timeline(ai,done){return `<div class="tl">${SPINE.map((s,i)=>{const cls=i<ai||done?'done':(i===ai&&!done?'act':'');const ic=i<ai||done?'<i class="fa-solid fa-check"></i>':(i+1);return `<div class="st ${cls}"><div class="dot">${ic}</div><small>${s[1]}</small></div>${i<SPINE.length-1?`<div class="ln ${i<ai||done?'done':''}"></div>`:''}`;}).join('')}</div>`;}
function activeView(){const proc=runs.filter(r=>r.status==='processing').length,done=runs.filter(r=>r.status==='complete').length,rev=runs.filter(r=>r.status==='review').length;
  const cards=[['Jobs in batch',runs.length,'#d7cfee'],['Processing',proc,'#fbbf24'],['Delivered',done,'#34d399'],['Needs review',rev,'#f87171']];
  return `<div class="h1">Active runs</div><div class="sub">Live — refreshes every 5s. Containerized, orchestrated per job.</div>
   <div class="stats">${cards.map(c=>`<div class="stat"><div class="n" style="color:${c[2]}">${c[1]}</div><div class="l">${c[0]}</div></div>`).join('')}</div>
   ${runs.length?runs.map(r=>{const done=r.status==='complete'||r.status==='review';return `<div class="runrow" ${done?`onclick="FS.open('${r.slide}')" style="cursor:pointer"`:''}><div class="top"><b>${r.slide}</b> · ${r.tissue}
     <span class="pill ${r.status[0]}">${r.status}</span><span style="margin-left:auto;color:#a99fce;font-size:12px">${r.model}</span></div>
     ${timeline(r.stageIdx,done)}
     <div style="color:#a99fce;font-size:12px">${done?`confidence: <b style="color:${QCOL(r.quality)}">${QLAB(r.quality)}</b> · ${r.fields} fields · <span style="color:${AC}">open inspector →</span>`:`stage ${Math.min(r.stageIdx+1,6)}/6 · ${r.prog}%`}</div></div>`;}).join(''):`<div class="card sub">No active runs. Go to <a onclick="FS.go('new')">Start New Run</a>.</div>`}`;}
function reportsView(){const done=runs.filter(r=>r.status==='complete'||r.status==='review');
  return `<div class="h1">Reports</div><div class="sub">Completed jobs with output quality. Click any to open the inspector.</div>
   ${done.length?`<div class="repgrid">${done.map(r=>{const col=QCOL(r.quality);return `<div class="repcard" onclick="FS.open('${r.slide}')"><div class="top"><b>${r.slide}</b><span class="pill ${r.status[0]}" style="margin-left:auto">${r.status}</span></div>
     <div class="riskbadge" style="border-color:${col};color:${col}">${QLAB(r.quality).toUpperCase()} CONF · ${r.quality.toFixed(2)}</div>
     <div class="sub" style="margin:8px 0 0">${r.fields} fields · ${r.flags} flags · $${r.cost}</div>
     <div style="margin-top:8px;color:${AC};font-size:12px"><i class="fa-solid fa-magnifying-glass-chart"></i> Open inspector →</div></div>`;}).join('')}</div>`:'<div class="card sub">No completed runs yet.</div>'}`;}
function settingsView(){return `<div class="h1">Pipeline modules</div><div class="sub">Composable, containerized steps orchestrated per job — swap the model or add a step.</div>
  ${[['Chunker','Token-aware splitting','core'],['Retriever','Vector + keyword RAG','core'],['LLM-FT','Fine-tuned inference model','core'],...MODULES.map(m=>[m.name,m.role,'optional'])].map(m=>`<div class="card" style="display:flex;align-items:center;gap:12px"><div style="width:34px;height:34px;border-radius:9px;background:#241c40;display:flex;align-items:center;justify-content:center;color:${AC}"><i class="fa-solid fa-cube"></i></div><div><b>${m[0]}</b><div class="sub" style="margin:2px 0 0">${m[1]}</div></div><span class="pill ${m[2]==='core'?'c':'q'}" style="margin-left:auto">${m[2]}</span></div>`).join('')}`;}

function render(){document.querySelectorAll('#nav a').forEach(a=>a.classList.toggle('on',a.dataset.v===view));
  const nb=$('#nav-active');if(nb){const na=runs.filter(r=>r.status==='processing').length;nb.textContent=na?na:'';}
  main().innerHTML=view==='new'?newView():view==='active'?activeView():view==='reports'?reportsView():settingsView();wire();}
function wire(){if(view==='new'){$('#ask').onclick=askAssistant;
  document.querySelectorAll('#ex .chip').forEach(c=>c.onclick=()=>{$('#obj').value=c.textContent;});
  document.querySelectorAll('#mods .chip').forEach(c=>c.onclick=()=>c.classList.toggle('on'));
  document.querySelectorAll('.slide input').forEach(ch=>ch.onchange=()=>{JOBS[ch.dataset.i].sel=ch.checked;const b=$('#start');if(b)b.innerHTML=`<i class="fa-solid fa-play"></i> Start batch pipeline (${selJobs().length} jobs)`;});
  const st=$('#start');if(st)st.onclick=startBatch;}}
function setView(v){view=v;render();}

function askAssistant(){if(streaming)return;const text=$('#obj').value;plan=planPipeline(text);streaming=true;
  const out=$('#planout');out.innerHTML=`<div class="think"><i class="fa-solid fa-circle-notch fa-spin"></i> Planning pipeline…</div>`;
  let li=0,ci=0;const lines=plan.reasoning;
  const tick=setInterval(()=>{if(li>=lines.length){clearInterval(tick);streaming=false;showPlan();return;}
   const acc=lines.slice(0,li).map(l=>'• '+l).join('<br>')+'<br>• '+lines[li].slice(0,ci)+'<span class="cursor"></span>';
   out.innerHTML=`<div class="think">${acc}</div>`;ci+=3;if(ci>=lines[li].length){li++;ci=0;}},16);}
function showPlan(){const steps=[...SPINE.map(s=>({n:s[1],why:'core stage'})),...plan.modules.map(m=>({n:m.name,why:m.role,opt:1}))];
  $('#planout').innerHTML=`<div class="think">${plan.reasoning.map(l=>'• '+l).join('<br>')}</div>
   <div class="plan">${steps.map((s,i)=>`<div class="step"><span class="ic">${i+1}</span><div><b>${s.n}</b> ${s.opt?'<span class="pill q" style="margin-left:6px">module</span>':''}<div class="why">${s.why}</div></div></div>`).join('')}</div>
   <div class="sub" style="margin-top:8px">Model: <b style="color:#d7cfee">${plan.model}</b> · ${plan.params}</div>`;
  document.querySelectorAll('#mods .chip').forEach(c=>c.classList.toggle('on',!!plan.modules.find(m=>m.id===c.dataset.m)));
  const st=$('#start');if(st)st.disabled=false;}

function startBatch(){const jobs=selJobs();if(!jobs.length)return;
  runs=jobs.map(s=>{const quality=R(0.45,0.97);
    return {slide:s.id,tissue:s.kind,model:(plan&&plan.model)||'LLM-FT',stageIdx:0,prog:0,status:'queued',
     quality,fields:RI(4,14),flags:RI(0,4),cost:(R(0.4,6)).toFixed(2),tokens:RI(2,60),acc:RI(88,99),pathology:quality<0.55};});
  setView('active');}
setInterval(()=>{let ch=false;runs.forEach(r=>{if(r.status==='complete'||r.status==='review')return;
   if(r.status==='queued'){r.status='processing';ch=true;}r.prog+=RI(12,30);
   if(r.prog>=100){r.prog=0;r.stageIdx++;ch=true;if(r.stageIdx>=SPINE.length){r.stageIdx=SPINE.length;r.status=r.pathology&&Math.random()<0.6?'review':'complete';}}else ch=true;});
  if(ch&&view==='active')render();},1200);

function openInspector(r){if(!r)return;let m=document.getElementById('fs-modal');
  if(!m){m=document.createElement('div');m.id='fs-modal';m.className='modal-bk';document.body.appendChild(m);m.onclick=e=>{if(e.target===m)closeInspector();};}
  m.innerHTML=`<div class="modal-card"><button class="modal-x" onclick="FS.close()">&times;</button>
   <div class="modal-head"><i class="fa-solid fa-magnifying-glass-chart" style="color:${AC}"></i> <b>${r.slide}</b> · ${r.tissue} · ${r.model} <span class="pill ${r.status[0]}">${r.status}</span></div>
   ${qualityCard(r)}
   <div class="viewer" style="margin-top:14px"><div><div class="canvas" id="cv2">${docView(true)}</div>
     <div class="tog"><button id="mo1" class="on">Extractions</button><button id="mo0">Raw text</button></div></div>
    <div><div class="metric"><span>Confidence</span><b>${r.quality.toFixed(2)}</b></div>
      <div class="metric"><span>Fields extracted</span><b>${r.fields}</b></div>
      <div class="metric"><span>Risk flags</span><b>${r.flags}</b></div>
      <div class="metric"><span>Tokens</span><b>${r.tokens}k</b></div>
      <div class="metric"><span>Guardrails</span><b style="color:#34d399">passed</b></div>
      <div style="margin-top:12px"><button class="btn" style="width:100%"><i class="fa-solid fa-download"></i> Export JSON</button></div></div></div></div>`;
  m.classList.add('open');
  const o1=document.getElementById('mo1'),o0=document.getElementById('mo0');
  o1.onclick=()=>{document.getElementById('cv2').innerHTML=docView(true);o1.classList.add('on');o0.classList.remove('on');};
  o0.onclick=()=>{document.getElementById('cv2').innerHTML=docView(false);o0.classList.add('on');o1.classList.remove('on');};}
function closeInspector(){const m=document.getElementById('fs-modal');if(m)m.classList.remove('open');}

function welcome(){const m=document.createElement('div');m.className='modal-bk open';m.id='fs-welcome';
  m.innerHTML=`<div class="modal-card" style="max-width:520px;text-align:center"><div style="font-size:34px;margin-bottom:4px">⚙️</div>
   <div class="modal-head" style="justify-content:center;margin-bottom:8px">Welcome to&nbsp;<b>FlowSuite</b></div>
   <p class="sub" style="margin:0 0 4px">A generic AI/LLM pipeline orchestrator. Describe a task — the assistant plans and runs an LLM workflow (RAG, extraction, guardrails) over your data.</p>
   <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:16px">
    <button class="btn" id="w-run"><i class="fa-solid fa-bolt"></i> Run a sample pipeline</button>
    <button class="btn g" id="w-talk"><i class="fa-solid fa-wand-magic-sparkles"></i> I'll talk to the assistant</button></div>
   <p class="sub" style="margin-top:14px;font-size:12px">Synthetic demo — nothing is really processed. Navigate freely from the sidebar.</p></div>`;
  document.body.appendChild(m);m.onclick=e=>{if(e.target===m)m.remove();};
  document.getElementById('w-talk').onclick=()=>{m.remove();const o=$('#obj');if(o)o.focus();};
  document.getElementById('w-run').onclick=()=>{m.remove();runSample();};}
function runSample(){setView('new');const o=$('#obj');if(o)o.value=EXAMPLES[0];askAssistant();const iv=setInterval(()=>{if(!streaming){clearInterval(iv);startBatch();}},250);}

window.FS={go:setView,open:id=>openInspector(runs.find(r=>r.slide===id)),close:closeInspector};
document.querySelectorAll('#nav a').forEach(a=>a.onclick=()=>setView(a.dataset.v));
render();welcome();
})();
