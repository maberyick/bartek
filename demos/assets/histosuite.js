/* HistoSuite demo app — synthetic data only, nothing is really processed. */
(function(){
// Inject interactive-critical CSS from JS so the modal/risk card render even if a
// stale pathology.html is cached (keeps JS + styles in sync).
(function injectCSS(){
  const css=`
  .modal-bk{position:fixed;inset:0;background:rgba(4,10,20,.72);display:none;align-items:flex-start;justify-content:center;padding:30px 16px;overflow:auto;z-index:9999}
  .modal-bk.open{display:flex}
  .modal-card{background:#111c2e;border:1px solid #24344e;border-radius:16px;padding:20px;max-width:820px;width:100%;position:relative;color:#e7eef7}
  .modal-x{position:absolute;top:12px;right:14px;background:#1b2a42;border:0;color:#cfe0f5;width:30px;height:30px;border-radius:8px;font-size:18px;cursor:pointer}
  .modal-head{font-size:16px;display:flex;align-items:center;gap:10px;margin-bottom:14px}.modal-head b{color:#fff}
  .riskcard{background:linear-gradient(180deg,#0e1b2c,#0c1626);border:1px solid #1c3350;border-radius:14px;padding:16px}
  .rc-head{font-size:12px;text-transform:uppercase;letter-spacing:.6px;color:#8fa2bd;margin-bottom:10px}
  .rc-body{display:flex;gap:20px;align-items:center;flex-wrap:wrap}
  .rc-stats{display:flex;gap:14px;flex-wrap:wrap;flex:1}
  .rc-tile{background:#0c1626;border:1px solid #24344e;border-radius:11px;padding:10px 14px;min-width:120px}
  .rc-tile .t{font-size:11px;color:#8fa2bd;text-transform:uppercase}.rc-tile .v{font-size:24px;font-weight:800;color:#fff;line-height:1.1;margin-top:2px}.rc-tile .s{font-size:11.5px;color:#8fa2bd}
  .rc-note{font-size:11.5px;color:#8fa2bd;margin-top:12px;border-top:1px solid #16243a;padding-top:8px}
  .repgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px}
  .repcard{background:#0e1a2b;border:1px solid #24344e;border-radius:12px;padding:13px;cursor:pointer}.repcard:hover{border-color:#22d3ee}
  .repcard .top{display:flex;align-items:center;gap:8px;font-size:13.5px}
  .riskbadge{display:inline-block;margin-top:8px;border:1px solid #24344e;border-radius:8px;padding:4px 10px;font-size:12px;font-weight:800}
  .viewer{display:grid;grid-template-columns:1fr 220px;gap:14px}@media(max-width:640px){.viewer{grid-template-columns:1fr}}
  .canvas{background:#050a12;border-radius:10px;overflow:hidden}.canvas svg{display:block;width:100%}
  .metric{display:flex;justify-content:space-between;font-size:13px;padding:6px 0;border-bottom:1px solid #16243a}.metric b{color:#fff}
  .tog{display:flex;gap:8px;margin-top:8px}.tog button{flex:1;font-size:12px;padding:6px;border:1px solid #24344e;background:#0c1626;color:#b7c6dc;border-radius:7px;cursor:pointer}.tog button.on{background:#22d3ee;color:#04121f;border-color:#22d3ee}
  .backbtn{display:block;text-align:center;background:#132339;border:1px solid #24344e;color:#cfe0f5;border-radius:9px;padding:9px;margin-bottom:12px;cursor:pointer;font-size:13px;font-weight:600}.backbtn:hover{border-color:#22d3ee;color:#fff}`;
  const s=document.createElement('style'); s.textContent=css; document.head.appendChild(s);
})();
const $=s=>document.querySelector(s), main=()=>document.getElementById('main');
const R=(a,b)=>a+Math.random()*(b-a),RI=(a,b)=>Math.floor(R(a,b+1)),pick=a=>a[RI(0,a.length-1)];
const esc=s=>String(s).replace(/[<>&]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]));

const SLIDES=[
  {id:'S-2041',tissue:'breast',size:'1.2 GB',sel:true},
  {id:'S-2042',tissue:'lung',size:'0.9 GB',sel:true},
  {id:'S-2043',tissue:'colon',size:'1.6 GB',sel:false},
  {id:'S-2044',tissue:'prostate',size:'1.1 GB',sel:false},
  {id:'S-2045',tissue:'breast',size:'1.4 GB',sel:false},
];
const MODULES=[
  {id:'histoqc',name:'HistoQC',role:'Slide QC / artifact screening',kw:['quality','artifact','qc','clean','blur']},
  {id:'stardist',name:'StarDist',role:'Nuclei / cell segmentation',kw:['nuclei','cell','density','count','morpholog']},
  {id:'phenocell',name:'PhenoCell',role:'Cell-phenotype composition',kw:['phenotype','composition']},
  {id:'spatialtil',name:'Spatial-TIL',role:'Immune spatial interaction',kw:['til','immune','microenvironment','spatial','lymphocyte']},
];
const SPINE=[['ingest','Ingest'],['convert','Convert'],['clam','Patch · CLAM'],['virchow','Features · Virchow2'],['progpath','Prognosis · ProgPath'],['finalize','Finalize']];
const EXAMPLES=['Predict prognosis and flag tumor regions','Screen slide quality, then segment nuclei and score cell density','Full immune microenvironment (TIL) + prognosis','Just run the core prognosis pipeline'];

let view='new',plan=null,streaming=false,runs=[],sel=null,overlay=true;

// ---- The Assistant: plain-English objective -> pipeline plan ----
function planPipeline(text){
  const t=(text||'').toLowerCase();
  const mods=MODULES.filter(m=>m.kw.some(k=>t.includes(k)));
  if(!mods.find(m=>m.id==='histoqc')) mods.unshift(MODULES[0]);      // QC always first
  const wantsTumor=/tumor|region|segment|lesion|flag/.test(t)|| !t;
  const model='Virchow2-FM';
  const reasoning=[];
  reasoning.push(`Parsed your goal: “${(text||'full prognosis analysis').trim()}”.`);
  reasoning.push(`Core spine will run: CLAM patching → ${model} features → ProgPath prognosis (low / intermediate / high).`);
  if(wantsTumor) reasoning.push(`You want tumor regions flagged → I'll produce a tumor-region overlay in the QC view.`);
  mods.forEach(m=>reasoning.push(`Adding ${m.name} — ${m.role} — because it matches your goal.`));
  reasoning.push(`Recommended feature model: ${model} (94% fit) — strongest general histology foundation model for this tissue mix.`);
  reasoning.push(`Params: 256 px patches @ 0.5 MPP, batch 64, continue-on-failure. Est. ~3,200 patches/slide, ~90 s/slide.`);
  return {model,modules:mods,wantsTumor,reasoning,params:'256px @ 0.5 MPP · batch 64'};
}

// ---- views ----
function setView(v){view=v;render();}
function selectedSlides(){return SLIDES.filter(s=>s.sel);}

function newView(){
  return `<div class="h1">Start a new run</div>
  <div class="sub">Describe what you want to learn — the Assistant plans the whole pipeline, or configure it yourself.</div>

  <div class="card asst">
    <div class="head"><i class="fa-solid fa-wand-magic-sparkles"></i> Pipeline Assistant</div>
    <textarea id="obj" placeholder="e.g. Predict prognosis and flag tumor regions...">${esc(plan?plan._text:'')}</textarea>
    <div class="chips" id="ex">${EXAMPLES.map(e=>`<span class="chip">${e}</span>`).join('')}</div>
    <div style="margin-top:12px"><button class="btn" id="ask"><i class="fa-solid fa-robot"></i> Ask the Assistant to plan it</button></div>
    <div id="planout" style="margin-top:14px"></div>
  </div>

  <div class="card"><h3>Slides (${SLIDES.length}) — ${selectedSlides().length} selected</h3>
    ${SLIDES.map((s,i)=>`<label class="slide"><input type="checkbox" data-i="${i}" ${s.sel?'checked':''}>
      <b>${s.id}</b> · ${s.tissue} <span class="meta">${s.size}</span></label>`).join('')}
  </div>

  <div class="card"><h3>Analysis modules (optional)</h3>
    <div class="chips" id="mods">${MODULES.map(m=>`<span class="chip ${plan&&plan.modules.find(x=>x.id===m.id)?'on':''}" data-m="${m.id}">${m.name}</span>`).join('')}</div>
    <div class="sub" style="margin:10px 0 0">Core spine (CLAM → Virchow2 → ProgPath) always runs. Modules branch after patching.</div>
  </div>

  <button class="btn" id="start" ${plan?'':'disabled'} style="font-size:15px;padding:13px 22px"><i class="fa-solid fa-play"></i> Start batch pipeline (${selectedSlides().length} slides)</button>`;
}

function timeline(activeIdx,done){
  return `<div class="tl">${SPINE.map((s,i)=>{
    const cls=i<activeIdx||done?'done':(i===activeIdx&&!done?'act':'');
    const ic=i<activeIdx||done?'<i class="fa-solid fa-check"></i>':(i+1);
    return `<div class="st ${cls}"><div class="dot">${ic}</div><small>${s[1]}</small></div>${i<SPINE.length-1?`<div class="ln ${i<activeIdx||done?'done':''}"></div>`:''}`;
  }).join('')}</div>`;
}

function activeView(){
  const proc=runs.filter(r=>r.status==='processing').length,done=runs.filter(r=>r.status==='complete').length,rev=runs.filter(r=>r.status==='review').length;
  const cards=[['Slides in batch',runs.length,'#cfe0f5'],['Processing',proc,'#fbbf24'],['Completed',done,'#34d399'],['Flagged',rev,'#f87171']];
  return `<div class="h1">Active runs</div><div class="sub">Live — refreshes every 5s. Airflow fans out per-slide, per-stage tasks.</div>
  <div class="stats">${cards.map(c=>`<div class="stat"><div class="n" style="color:${c[2]}">${c[1]}</div><div class="l">${c[0]}</div></div>`).join('')}</div>
  ${runs.length?runs.map(r=>{const done=r.status==='complete'||r.status==='review';
    return `<div class="runrow" ${done?`onclick="HS.open('${r.slide}')" style="cursor:pointer"`:''}><div class="top"><b>${r.slide}</b> · ${r.tissue}
    <span class="pill ${r.status[0]}">${r.status}</span>
    <span style="margin-left:auto;color:#8fa2bd;font-size:12px">${r.model}</span></div>
    ${timeline(r.stageIdx,done)}
    <div style="color:#8fa2bd;font-size:12px">${done?`risk: <b style="color:${RCOL(r.bucket)}">${r.bucket}</b> · ${r.patches} patches · <span style="color:#22d3ee">open inspector →</span>`:`stage ${Math.min(r.stageIdx+1,6)}/6 · ${r.prog}%`}</div>
  </div>`;}).join(''):`<div class="card sub">No active runs. Go to <a onclick="HS.go('new')">Start New Run</a>.</div>`}`;
}

function reportsView(){
  const done=runs.filter(r=>r.status==='complete'||r.status==='review');
  return `<div class="h1">Reports</div><div class="sub">Completed runs with patient risk. Click any card to open the inspector.</div>
  ${done.length?`<div class="repgrid">${done.map(r=>{const col=RCOL(r.bucket);
    return `<div class="repcard" onclick="HS.open('${r.slide}')"><div class="top"><b>${r.slide}</b> · ${r.tissue}
      <span class="pill ${r.status[0]}" style="margin-left:auto">${r.status}</span></div>
      <div class="riskbadge" style="border-color:${col};color:${col}">${r.bucket.toUpperCase()} RISK · ${r.risk.toFixed(2)}</div>
      <div class="sub" style="margin:8px 0 0">5-yr survival <b style="color:#cfe0f5">${r.survival}%</b> · response <b style="color:#cfe0f5">${r.response}%</b></div>
      <div style="margin-top:8px;color:#22d3ee;font-size:12px"><i class="fa-solid fa-magnifying-glass-chart"></i> Open inspector →</div></div>`;
  }).join('')}</div>`:'<div class="card sub">No completed runs yet. Start a batch from <a onclick="HS.go(\'new\')">New Run</a>.</div>'}`;
}

function settingsView(){
  return `<div class="h1">Analysis modules</div><div class="sub">Public methods integrated as optional branches after patching.</div>
  ${[['CLAM','Tissue segmentation + patch extraction','core'],['Virchow2','Foundation-model patch features','core'],['ProgPath','Slide-level prognosis head','core'],
     ...MODULES.map(m=>[m.name,m.role,'optional'])].map(m=>`<div class="card" style="display:flex;align-items:center;gap:12px">
     <div style="width:34px;height:34px;border-radius:9px;background:#132339;display:flex;align-items:center;justify-content:center;color:#22d3ee"><i class="fa-solid fa-cube"></i></div>
     <div><b>${m[0]}</b><div class="sub" style="margin:2px 0 0">${m[1]}</div></div>
     <span class="pill ${m[2]==='core'?'c':'q'}" style="margin-left:auto">${m[2]}</span></div>`).join('')}`;
}

function render(){
  document.querySelectorAll('#nav a').forEach(a=>a.classList.toggle('on',a.dataset.v===view));
  const na=runs.filter(r=>r.status==='processing').length; $('#nav-active').textContent=na?na:'';
  main().innerHTML = view==='new'?newView():view==='active'?activeView():view==='reports'?reportsView():settingsView();
  wire();
}

function wire(){
  if(view==='new'){
    $('#ask').onclick=()=>askAssistant();
    document.querySelectorAll('#ex .chip').forEach(c=>c.onclick=()=>{$('#obj').value=c.textContent;});
    document.querySelectorAll('#mods .chip').forEach(c=>c.onclick=()=>c.classList.toggle('on'));
    document.querySelectorAll('.slide input').forEach(ch=>ch.onchange=()=>{SLIDES[ch.dataset.i].sel=ch.checked;
      $('#start').textContent='';const b=$('#start');b.innerHTML=`<i class="fa-solid fa-play"></i> Start batch pipeline (${selectedSlides().length} slides)`;});
    const st=$('#start'); if(st) st.onclick=()=>startBatch();
  }
  if(view==='reports'&&sel){ const o1=$('#ov1'),o0=$('#ov0');
    if(o1)o1.onclick=()=>{overlay=true;render();}; if(o0)o0.onclick=()=>{overlay=false;render();}; }
}

// ---- assistant streaming ----
function askAssistant(){
  if(streaming)return; const text=$('#obj').value; plan=planPipeline(text); plan._text=text; streaming=true;
  const out=$('#planout'); out.innerHTML=`<div class="think"><i class="fa-solid fa-circle-notch fa-spin"></i> Planning pipeline…</div>`;
  let li=0,ci=0,acc='';
  const lines=plan.reasoning;
  const tick=setInterval(()=>{
    if(li>=lines.length){clearInterval(tick);streaming=false;showPlanSteps();return;}
    acc = lines.slice(0,li).map(l=>'• '+l).join('<br>') + '<br>• ' + lines[li].slice(0,ci) + '<span class="cursor"></span>';
    out.innerHTML=`<div class="think">${acc}</div>`;
    ci+=3; if(ci>=lines[li].length){li++;ci=0;}
  },16);
}
function showPlanSteps(){
  const steps=[...SPINE.map(s=>({n:s[1],why:'core stage'})), ...plan.modules.map(m=>({n:m.name,why:m.role,opt:1}))];
  $('#planout').innerHTML=`<div class="think">${plan.reasoning.map(l=>'• '+l).join('<br>')}</div>
    <div class="plan">${steps.map((s,i)=>`<div class="step"><span class="ic">${i+1}</span>
      <div><b>${s.n}</b> ${s.opt?'<span class="pill q" style="margin-left:6px">module</span>':''}<div class="why">${s.why}</div></div></div>`).join('')}</div>
    <div class="sub" style="margin-top:8px">Model: <b style="color:#cfe0f5">${plan.model}</b> · ${plan.params}</div>`;
  // sync module chips + enable start
  document.querySelectorAll('#mods .chip').forEach(c=>c.classList.toggle('on',!!plan.modules.find(m=>m.id===c.dataset.m)));
  const st=$('#start'); st.disabled=false;
}

// ---- run the batch ----
function startBatch(){
  const slides=selectedSlides(); if(!slides.length)return;
  runs = slides.map(s=>{
    const risk=R(0.12,0.9), bucket=risk<0.33?'low':risk>0.67?'high':'intermediate';
    const surv=Math.max(28,Math.min(96,Math.round(94-risk*62+R(-4,4))));
    const resp=Math.max(8,Math.min(96,Math.round((1-risk)*100*R(0.75,1.02))));
    return {slide:s.id,tissue:s.tissue,model:(plan&&plan.model)||'Virchow2-FM',
      stageIdx:0,prog:0,status:'queued', risk,bucket, prognosis:bucket+' ('+risk.toFixed(2)+')',
      survival:surv, response:resp, respLabel: resp>=60?'Likely responder':resp>=35?'Uncertain':'Unlikely responder',
      iou:R(0.86,0.94).toFixed(3),patches:RI(1800,4200),runtime:RI(70,140), pathology:Math.random()<0.4};
  });
  setView('active');
}
const RCOL=b=>b==='high'?'#f87171':b==='intermediate'?'#fbbf24':'#34d399';
function gauge(score,bucket){
  const W=180,H=104,cx=90,cy=94,r=74,col=RCOL(bucket);
  const pt=f=>[cx+Math.cos(Math.PI*(1-f))*r, cy-Math.sin(Math.PI*(1-f))*r];
  const arc=(a,b,c)=>{const[x1,y1]=pt(a),[x2,y2]=pt(b);return `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} A${r} ${r} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="${c}" stroke-width="11" stroke-linecap="round"/>`;};
  const[px,py]=pt(score);
  return `<svg viewBox="0 0 ${W} ${H}" width="176">${arc(0,0.33,'#34d399')}${arc(0.34,0.66,'#fbbf24')}${arc(0.67,1,'#f87171')}
    <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="8" fill="#0b1220" stroke="${col}" stroke-width="4"/>
    <text x="${cx}" y="${cy-16}" text-anchor="middle" fill="#fff" font-size="26" font-weight="800">${score.toFixed(2)}</text>
    <text x="${cx}" y="${cy}" text-anchor="middle" fill="${col}" font-size="12" font-weight="800">${bucket.toUpperCase()} RISK</text></svg>`;
}
function survivalCurve(surv){
  const W=124,H=40,n=10,pts=[];
  for(let i=0;i<=n;i++){const t=i/n,s=100-(100-surv)*Math.pow(t,0.75);pts.push([5+t*(W-10),H-5-(s/100)*(H-10)]);}
  return `<svg viewBox="0 0 ${W} ${H}" width="118" style="margin-top:5px"><polyline points="${pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ')}" fill="none" stroke="#8fa2bd" stroke-width="2"/></svg>`;
}
function riskCard(r){const col=RCOL(r.bucket);
  return `<div class="riskcard"><div class="rc-head"><i class="fa-solid fa-heart-pulse" style="color:${col}"></i> Patient risk — recurrence · survival · therapy response</div>
   <div class="rc-body">${gauge(r.risk,r.bucket)}
     <div class="rc-stats">
       <div class="rc-tile"><div class="t">ProgPath risk</div><div class="v" style="color:${col}">${r.bucket}</div><div class="s">score ${r.risk.toFixed(2)}</div></div>
       <div class="rc-tile"><div class="t">Est. 5-yr survival</div><div class="v">${r.survival}%</div>${survivalCurve(r.survival)}</div>
       <div class="rc-tile"><div class="t">Therapy response</div><div class="v" style="color:${col}">${r.response}%</div><div class="s">${r.respLabel}</div></div>
     </div></div>
   <div class="rc-note">Synthetic prediction for demo. In production, ProgPath aggregates Virchow2 patch features into a calibrated risk score with survival &amp; response estimates.</div></div>`;
}
function openInspector(r){ if(!r)return;
  let m=document.getElementById('hs-modal'); if(!m){m=document.createElement('div');m.id='hs-modal';m.className='modal-bk';document.body.appendChild(m);m.onclick=e=>{if(e.target===m)closeInspector();};}
  m.innerHTML=`<div class="modal-card"><button class="modal-x" onclick="HS.close()">&times;</button>
    <div class="modal-head"><i class="fa-solid fa-magnifying-glass-chart" style="color:#22d3ee"></i> <b>${r.slide}</b> · ${r.tissue} · ${r.model} <span class="pill ${r.status[0]}">${r.status}</span></div>
    ${riskCard(r)}
    <div class="viewer" style="margin-top:14px">
      <div><div class="canvas" id="cv2">${window.BK.pathoImage(true)}</div>
        <div class="tog"><button id="mo1" class="on">Tumor overlay</button><button id="mo0">Raw H&amp;E</button></div></div>
      <div><div class="metric"><span>Tumor region (IoU)</span><b>${r.iou}</b></div>
        <div class="metric"><span>Patches</span><b>${r.patches}</b></div>
        <div class="metric"><span>Runtime</span><b>${r.runtime}s</b></div>
        <div class="metric"><span>QC (HistoQC)</span><b style="color:#34d399">passed</b></div>
        <div class="metric"><span>Feature model</span><b>${r.model}</b></div>
        <div style="margin-top:12px"><button class="btn" style="width:100%"><i class="fa-solid fa-file-pdf"></i> Download report</button></div></div>
    </div></div>`;
  m.classList.add('open');
  const o1=document.getElementById('mo1'),o0=document.getElementById('mo0');
  o1.onclick=()=>{document.getElementById('cv2').innerHTML=window.BK.pathoImage(true);o1.classList.add('on');o0.classList.remove('on');};
  o0.onclick=()=>{document.getElementById('cv2').innerHTML=window.BK.pathoImage(false);o0.classList.add('on');o1.classList.remove('on');};
}
function closeInspector(){const m=document.getElementById('hs-modal');if(m)m.classList.remove('open');}
setInterval(()=>{
  let ch=false;
  runs.forEach(r=>{
    if(r.status==='complete'||r.status==='review')return;
    if(r.status==='queued'){r.status='processing';ch=true;}
    r.prog+=RI(12,30);
    if(r.prog>=100){r.prog=0;r.stageIdx++;ch=true;
      if(r.stageIdx>=SPINE.length){r.stageIdx=SPINE.length;r.status=r.pathology&&Math.random()<0.5?'review':'complete';}}
    else ch=true;
  });
  if(ch&&view==='active')render();
},1200);

// ---- onboarding ----
function welcome(){
  const m=document.createElement('div'); m.className='modal-bk open'; m.id='hs-welcome';
  m.innerHTML=`<div class="modal-card" style="max-width:520px;text-align:center">
    <div style="font-size:34px;margin-bottom:4px">🔬</div>
    <div class="modal-head" style="justify-content:center;margin-bottom:8px">Welcome to&nbsp;<b>HistoSuite</b></div>
    <p class="sub" style="margin:0 0 4px">An AI-orchestrated whole-slide pathology pipeline. Tell the assistant what you want to learn — it plans and runs the whole thing, then shows each patient's risk.</p>
    <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:16px">
      <button class="btn" id="w-run"><i class="fa-solid fa-bolt"></i> Run a sample pipeline</button>
      <button class="btn g" id="w-talk"><i class="fa-solid fa-wand-magic-sparkles"></i> I'll talk to the assistant</button>
    </div>
    <p class="sub" style="margin-top:14px;font-size:12px">Synthetic demo — nothing is really processed. Navigate freely from the sidebar anytime.</p></div>`;
  document.body.appendChild(m);
  m.onclick=e=>{if(e.target===m)m.remove();};
  document.getElementById('w-talk').onclick=()=>{m.remove();const o=document.getElementById('obj');if(o)o.focus();};
  document.getElementById('w-run').onclick=()=>{m.remove();runSample();};
}
function runSample(){
  setView('new');
  const o=document.getElementById('obj'); if(o) o.value=EXAMPLES[0];
  askAssistant();
  const iv=setInterval(()=>{ if(!streaming){clearInterval(iv); startBatch();} }, 250);
}

window.HS={go:setView,open:id=>openInspector(runs.find(r=>r.slide===id)),close:closeInspector};
document.querySelectorAll('#nav a').forEach(a=>a.onclick=()=>setView(a.dataset.v)); // wire the sidebar (was missing)
render();
welcome();
})();
