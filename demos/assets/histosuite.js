/* HistoSuite demo app — synthetic data only, nothing is really processed. */
(function(){
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
  ${runs.length?runs.map(r=>`<div class="runrow"><div class="top"><b>${r.slide}</b> · ${r.tissue}
    <span class="pill ${r.status[0]}">${r.status}</span>
    <span style="margin-left:auto;color:#8fa2bd;font-size:12px">${r.model}</span></div>
    ${timeline(r.stageIdx,r.status==='complete'||r.status==='review')}
    <div style="color:#8fa2bd;font-size:12px">${r.status==='complete'||r.status==='review'?`prognosis: <b style="color:#cfe0f5">${r.prognosis}</b> · ${r.patches} patches`:`stage ${Math.min(r.stageIdx+1,6)}/6 · ${r.prog}%`}</div>
  </div>`).join(''):`<div class="card sub">No active runs. Go to <a onclick="HS.go('new')">Start New Run</a>.</div>`}`;
}

function reportsView(){
  const done=runs.filter(r=>r.status==='complete'||r.status==='review');
  if(!sel&&done.length)sel=done[0];
  return `<div class="h1">Reports</div><div class="sub">Completed runs and QC. Click a run to view its result.</div>
  <div class="row"><div style="flex:0 0 260px">
    ${done.length?done.map(r=>`<div class="runrow ${r===sel?'sel':''}" onclick="HS.pick('${r.slide}')"><div class="top"><b>${r.slide}</b>
      <span class="pill ${r.status[0]}">${r.status}</span></div>
      <div style="color:#8fa2bd;font-size:12px">${r.prognosis} · IoU ${r.iou}</div></div>`).join(''):'<div class="card sub">No completed runs yet.</div>'}
  </div>
  <div style="flex:1;min-width:320px">${sel?`<div class="card"><h3>${sel.slide} · ${sel.tissue} · ${sel.model}</h3>
    <div class="viewer"><div><div class="canvas" id="cv">${window.BK.pathoImage(overlay)}</div>
      <div class="tog"><button id="ov1" class="${overlay?'on':''}">Overlay</button><button id="ov0" class="${overlay?'':'on'}">Raw H&E</button></div></div>
      <div><div class="metric"><span>Prognosis</span><b>${sel.prognosis}</b></div>
        <div class="metric"><span>Tumor region (IoU)</span><b>${sel.iou}</b></div>
        <div class="metric"><span>Patches</span><b>${sel.patches}</b></div>
        <div class="metric"><span>Runtime</span><b>${sel.runtime}s</b></div>
        <div class="metric"><span>QC</span><b style="color:#34d399">passed</b></div>
        <div style="margin-top:12px"><button class="btn g" style="width:100%"><i class="fa-solid fa-file-pdf"></i> Download report</button></div>
      </div></div></div>`:''}</div></div>`;
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
  runs = slides.map(s=>({slide:s.id,tissue:s.tissue,model:(plan&&plan.model)||'Virchow2-FM',
    stageIdx:0,prog:0,status:'queued', prognosis:pick(['low','intermediate','high'])+' ('+R(0.1,0.9).toFixed(2)+')',
    iou:R(0.86,0.94).toFixed(3),patches:RI(1800,4200),runtime:RI(70,140), pathology:Math.random()<0.4}));
  setView('active');
}
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

window.HS={go:setView,pick:id=>{sel=runs.find(r=>r.slide===id);render();}};
render();
})();
