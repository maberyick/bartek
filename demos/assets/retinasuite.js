/* RetinaSuite (OCT) demo app — synthetic data only. Emerald/teal theme. */
(function(){
const AC='#2dd4bf'; // teal accent
(function injectCSS(){const css=`
 .modal-bk{position:fixed;inset:0;background:rgba(4,14,12,.72);display:none;align-items:flex-start;justify-content:center;padding:30px 16px;overflow:auto;z-index:9999}
 .modal-bk.open{display:flex}
 .modal-card{background:#0f1e1b;border:1px solid #234b44;border-radius:16px;padding:20px;max-width:820px;width:100%;position:relative;color:#e7f4f1}
 .modal-x{position:absolute;top:12px;right:14px;background:#123029;border:0;color:#cfeee7;width:30px;height:30px;border-radius:8px;font-size:18px;cursor:pointer}
 .modal-head{font-size:16px;display:flex;align-items:center;gap:10px;margin-bottom:14px}.modal-head b{color:#fff}
 .riskcard{background:linear-gradient(180deg,#0e211d,#0b1a17);border:1px solid #1c4a41;border-radius:14px;padding:16px}
 .rc-head{font-size:12px;text-transform:uppercase;letter-spacing:.6px;color:#8fbdb2;margin-bottom:10px}
 .rc-body{display:flex;gap:20px;align-items:center;flex-wrap:wrap}.rc-stats{display:flex;gap:14px;flex-wrap:wrap;flex:1}
 .rc-tile{background:#0b1a17;border:1px solid #234b44;border-radius:11px;padding:10px 14px;min-width:120px}
 .rc-tile .t{font-size:11px;color:#8fbdb2;text-transform:uppercase}.rc-tile .v{font-size:24px;font-weight:800;color:#fff;line-height:1.1;margin-top:2px}.rc-tile .s{font-size:11.5px;color:#8fbdb2}
 .rc-note{font-size:11.5px;color:#8fbdb2;margin-top:12px;border-top:1px solid #163a34;padding-top:8px}
 .repgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px}
 .repcard{background:#0e211d;border:1px solid #234b44;border-radius:12px;padding:13px;cursor:pointer}.repcard:hover{border-color:${AC}}
 .repcard .top{display:flex;align-items:center;gap:8px;font-size:13.5px}
 .riskbadge{display:inline-block;margin-top:8px;border:1px solid #234b44;border-radius:8px;padding:4px 10px;font-size:12px;font-weight:800}
 .viewer{display:grid;grid-template-columns:1fr 220px;gap:14px}@media(max-width:640px){.viewer{grid-template-columns:1fr}}
 .canvas{background:#050f0d;border-radius:10px;overflow:hidden}.canvas svg{display:block;width:100%}
 .metric{display:flex;justify-content:space-between;font-size:13px;padding:6px 0;border-bottom:1px solid #163a34}.metric b{color:#fff}
 .tog{display:flex;gap:8px;margin-top:8px}.tog button{flex:1;font-size:12px;padding:6px;border:1px solid #234b44;background:#0b1a17;color:#a9d2c9;border-radius:7px;cursor:pointer}.tog button.on{background:${AC};color:#04121f;border-color:${AC}}
 .backbtn{display:block;text-align:center;background:#123029;border:1px solid #234b44;color:#cfeee7;border-radius:9px;padding:9px;margin-bottom:12px;cursor:pointer;font-size:13px;font-weight:600}.backbtn:hover{border-color:${AC};color:#fff}`;
 const s=document.createElement('style');s.textContent=css;document.head.appendChild(s);})();

const $=s=>document.querySelector(s),main=()=>document.getElementById('main');
const R=(a,b)=>a+Math.random()*(b-a),RI=(a,b)=>Math.floor(R(a,b+1)),pick=a=>a[RI(0,a.length-1)];
const esc=s=>String(s).replace(/[<>&]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]));

const SCANS=[
  {id:'OCT-3041',eye:'OD · right',size:'128 B-scans',sel:true},
  {id:'OCT-3042',eye:'OS · left',size:'128 B-scans',sel:true},
  {id:'OCT-3043',eye:'OD · right',size:'97 B-scans',sel:false},
  {id:'OCT-3044',eye:'OS · left',size:'128 B-scans',sel:false},
];
const MODULES=[
  {id:'imageqc',name:'ImageQC',role:'Scan quality / signal strength',kw:['quality','signal','artifact','clean']},
  {id:'fluidseg',name:'FluidSeg',role:'IRF / SRF fluid segmentation',kw:['fluid','irf','srf','edema','dme']},
  {id:'drusen',name:'DrusenNet',role:'Drusen / RPE change (AMD)',kw:['drusen','amd','rpe']},
  {id:'thickness',name:'ThicknessMap',role:'ETDRS thickness grid',kw:['thickness','etdrs','map','grid']},
];
const SPINE=[['ingest','Ingest'],['normalize','Normalize'],['layers','Layer seg'],['lesion','Lesion detect'],['qc','QC'],['report','Report']];
const EXAMPLES=['Segment retinal layers and flag fluid','Full AMD screen: layers, drusen and thickness','Grade DME severity and quantify fluid','Just run core layer segmentation'];
let view='new',plan=null,streaming=false,runs=[];

function planPipeline(text){const t=(text||'').toLowerCase();
  const mods=MODULES.filter(m=>m.kw.some(k=>t.includes(k)));
  if(!mods.find(m=>m.id==='imageqc'))mods.unshift(MODULES[0]);
  const wantsFluid=/fluid|irf|srf|edema|dme|lesion|flag/.test(t)||!t;
  const model='VisionFM-Seg',reasoning=[];
  reasoning.push(`Parsed your goal: “${(text||'core layer segmentation + fluid').trim()}”.`);
  reasoning.push(`Core spine: normalize → ${model} retinal layer segmentation (ILM/RPE/BM) → lesion/fluid detection → report.`);
  if(wantsFluid)reasoning.push(`You want fluid flagged → adding IRF/SRF overlays and a fluid-volume estimate.`);
  mods.forEach(m=>reasoning.push(`Adding ${m.name} — ${m.role} — based on your goal.`));
  reasoning.push(`Recommended model: ${model} (foundation model + MoE, 95% fit) — strong on complex retinal pathology.`);
  reasoning.push(`Params: per-B-scan inference, ETDRS thickness grid, continue-on-failure. ~1.4 s/scan.`);
  return {model,modules:mods,reasoning,params:'per-B-scan · ETDRS grid · MoE routing',_text:text};
}

const SEVCOL=s=>s==='urgent'?'#f87171':s==='moderate'?'#fbbf24':'#34d399';
function gauge(score,label,col){const W=180,H=104,cx=90,cy=94,r=74;
  const pt=f=>[cx+Math.cos(Math.PI*(1-f))*r,cy-Math.sin(Math.PI*(1-f))*r];
  const arc=(a,b,c)=>{const[x1,y1]=pt(a),[x2,y2]=pt(b);return `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} A${r} ${r} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="${c}" stroke-width="11" stroke-linecap="round"/>`;};
  const[px,py]=pt(score);
  return `<svg viewBox="0 0 ${W} ${H}" width="176">${arc(0,0.33,'#34d399')}${arc(0.34,0.66,'#fbbf24')}${arc(0.67,1,'#f87171')}
   <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="8" fill="#0b1a17" stroke="${col}" stroke-width="4"/>
   <text x="${cx}" y="${cy-16}" text-anchor="middle" fill="#fff" font-size="26" font-weight="800">${score.toFixed(2)}</text>
   <text x="${cx}" y="${cy}" text-anchor="middle" fill="${col}" font-size="12" font-weight="800">${label.toUpperCase()}</text></svg>`;}
function findingsCard(r){const col=SEVCOL(r.sev);
  return `<div class="riskcard"><div class="rc-head"><i class="fa-solid fa-eye" style="color:${col}"></i> OCT findings — referable disease · thickness · fluid</div>
   <div class="rc-body">${gauge(r.severity,r.sev+' risk',col)}
    <div class="rc-stats">
     <div class="rc-tile"><div class="t">Referable disease</div><div class="v" style="color:${col}">${r.sev}</div><div class="s">severity ${r.severity.toFixed(2)}</div></div>
     <div class="rc-tile"><div class="t">Central subfield</div><div class="v">${r.thickness} µm</div><div class="s">ETDRS · ${r.thickness>320?'thickened':'normal'}</div></div>
     <div class="rc-tile"><div class="t">Fluid volume</div><div class="v">${r.fluid} nL</div><div class="s">${r.findings.join(' · ')||'no lesions'}</div></div>
    </div></div>
   <div class="rc-note">Synthetic prediction. In production, ${r.model} segments layers &amp; lesions; findings drive a referable-disease severity for triage.</div></div>`;}

function selSlides(){return SCANS.filter(s=>s.sel);}
function newView(){return `<div class="h1">Start a new run</div>
  <div class="sub">Describe what you want to assess — the Assistant plans the OCT pipeline, or configure it yourself.</div>
  <div class="card asst"><div class="head"><i class="fa-solid fa-wand-magic-sparkles"></i> Pipeline Assistant</div>
   <textarea id="obj" placeholder="e.g. Segment retinal layers and flag fluid...">${esc(plan?plan._text:'')}</textarea>
   <div class="chips" id="ex">${EXAMPLES.map(e=>`<span class="chip">${e}</span>`).join('')}</div>
   <div style="margin-top:12px"><button class="btn" id="ask"><i class="fa-solid fa-robot"></i> Ask the Assistant to plan it</button></div>
   <div id="planout" style="margin-top:14px"></div></div>
  <div class="card"><h3>OCT scans (${SCANS.length}) — ${selSlides().length} selected</h3>
   ${SCANS.map((s,i)=>`<label class="slide"><input type="checkbox" data-i="${i}" ${s.sel?'checked':''}> <b>${s.id}</b> · ${s.eye} <span class="meta">${s.size}</span></label>`).join('')}</div>
  <div class="card"><h3>Analysis modules (optional)</h3>
   <div class="chips" id="mods">${MODULES.map(m=>`<span class="chip ${plan&&plan.modules.find(x=>x.id===m.id)?'on':''}" data-m="${m.id}">${m.name}</span>`).join('')}</div>
   <div class="sub" style="margin:10px 0 0">Core spine (normalize → layer seg → lesion detect) always runs.</div></div>
  <button class="btn" id="start" ${plan?'':'disabled'} style="font-size:15px;padding:13px 22px"><i class="fa-solid fa-play"></i> Start batch pipeline (${selSlides().length} scans)</button>`;}
function timeline(ai,done){return `<div class="tl">${SPINE.map((s,i)=>{const cls=i<ai||done?'done':(i===ai&&!done?'act':'');const ic=i<ai||done?'<i class="fa-solid fa-check"></i>':(i+1);return `<div class="st ${cls}"><div class="dot">${ic}</div><small>${s[1]}</small></div>${i<SPINE.length-1?`<div class="ln ${i<ai||done?'done':''}"></div>`:''}`;}).join('')}</div>`;}
function activeView(){const proc=runs.filter(r=>r.status==='processing').length,done=runs.filter(r=>r.status==='complete').length,rev=runs.filter(r=>r.status==='review').length;
  const cards=[['Scans in batch',runs.length,'#cfeee7'],['Processing',proc,'#fbbf24'],['Completed',done,'#34d399'],['Referable',rev,'#f87171']];
  return `<div class="h1">Active runs</div><div class="sub">Live — refreshes every 5s. Per-scan, per-stage tasks.</div>
   <div class="stats">${cards.map(c=>`<div class="stat"><div class="n" style="color:${c[2]}">${c[1]}</div><div class="l">${c[0]}</div></div>`).join('')}</div>
   ${runs.length?runs.map(r=>{const done=r.status==='complete'||r.status==='review';return `<div class="runrow" ${done?`onclick="RS.open('${r.slide}')" style="cursor:pointer"`:''}><div class="top"><b>${r.slide}</b> · ${r.tissue}
     <span class="pill ${r.status[0]}">${r.status}</span><span style="margin-left:auto;color:#8fbdb2;font-size:12px">${r.model}</span></div>
     ${timeline(r.stageIdx,done)}
     <div style="color:#8fbdb2;font-size:12px">${done?`referable: <b style="color:${SEVCOL(r.sev)}">${r.sev}</b> · ${r.findings.join(' · ')||'no lesions'} · <span style="color:${AC}">open inspector →</span>`:`stage ${Math.min(r.stageIdx+1,6)}/6 · ${r.prog}%`}</div></div>`;}).join(''):`<div class="card sub">No active runs. Go to <a onclick="RS.go('new')">Start New Run</a>.</div>`}`;}
function reportsView(){const done=runs.filter(r=>r.status==='complete'||r.status==='review');
  return `<div class="h1">Reports</div><div class="sub">Completed scans with findings. Click any to open the inspector.</div>
   ${done.length?`<div class="repgrid">${done.map(r=>{const col=SEVCOL(r.sev);return `<div class="repcard" onclick="RS.open('${r.slide}')"><div class="top"><b>${r.slide}</b> · ${r.tissue}<span class="pill ${r.status[0]}" style="margin-left:auto">${r.status}</span></div>
     <div class="riskbadge" style="border-color:${col};color:${col}">${r.sev.toUpperCase()} · ${r.severity.toFixed(2)}</div>
     <div class="sub" style="margin:8px 0 0">CST <b style="color:#cfeee7">${r.thickness}µm</b> · fluid <b style="color:#cfeee7">${r.fluid}nL</b></div>
     <div style="margin-top:8px;color:${AC};font-size:12px"><i class="fa-solid fa-magnifying-glass-chart"></i> Open inspector →</div></div>`;}).join('')}</div>`:'<div class="card sub">No completed runs yet.</div>'}`;}
function settingsView(){return `<div class="h1">Analysis modules</div><div class="sub">Foundation-model segmentation with optional lesion/thickness branches.</div>
  ${[['VisionFM-Seg','Foundation-model retinal layer segmentation','core'],['MoE-Retina','Routes complex pathology to an expert','core'],['LesionNet','IRF/SRF fluid + drusen detection','core'],...MODULES.map(m=>[m.name,m.role,'optional'])].map(m=>`<div class="card" style="display:flex;align-items:center;gap:12px"><div style="width:34px;height:34px;border-radius:9px;background:#123029;display:flex;align-items:center;justify-content:center;color:${AC}"><i class="fa-solid fa-cube"></i></div><div><b>${m[0]}</b><div class="sub" style="margin:2px 0 0">${m[1]}</div></div><span class="pill ${m[2]==='core'?'c':'q'}" style="margin-left:auto">${m[2]}</span></div>`).join('')}`;}

function render(){document.querySelectorAll('#nav a').forEach(a=>a.classList.toggle('on',a.dataset.v===view));
  const na=runs.filter(r=>r.status==='processing').length;const nb=$('#nav-active');if(nb)nb.textContent=na?na:'';
  main().innerHTML=view==='new'?newView():view==='active'?activeView():view==='reports'?reportsView():settingsView();wire();}
function wire(){if(view==='new'){$('#ask').onclick=askAssistant;
  document.querySelectorAll('#ex .chip').forEach(c=>c.onclick=()=>{$('#obj').value=c.textContent;});
  document.querySelectorAll('#mods .chip').forEach(c=>c.onclick=()=>c.classList.toggle('on'));
  document.querySelectorAll('.slide input').forEach(ch=>ch.onchange=()=>{SCANS[ch.dataset.i].sel=ch.checked;const b=$('#start');if(b)b.innerHTML=`<i class="fa-solid fa-play"></i> Start batch pipeline (${selSlides().length} scans)`;});
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
   <div class="sub" style="margin-top:8px">Model: <b style="color:#cfeee7">${plan.model}</b> · ${plan.params}</div>`;
  document.querySelectorAll('#mods .chip').forEach(c=>c.classList.toggle('on',!!plan.modules.find(m=>m.id===c.dataset.m)));
  const st=$('#start');if(st)st.disabled=false;}

function startBatch(){const scans=selSlides();if(!scans.length)return;
  runs=scans.map(s=>{const severity=R(0.1,0.92),sev=severity<0.33?'low':severity>0.66?'urgent':'moderate';
    const thickness=RI(250,470),fluid=severity>0.42?RI(18,150):0,findings=[];
    if(fluid>0)findings.push(pick(['IRF','SRF']));if(severity>0.5&&Math.random()<0.6)findings.push('drusen');
    return {slide:s.id,tissue:s.eye,model:(plan&&plan.model)||'VisionFM-Seg',stageIdx:0,prog:0,status:'queued',
     severity,sev,thickness,fluid,findings,dice:R(0.93,0.98).toFixed(3),pathology:fluid>0};});
  setView('active');}
setInterval(()=>{let ch=false;runs.forEach(r=>{if(r.status==='complete'||r.status==='review')return;
   if(r.status==='queued'){r.status='processing';ch=true;}r.prog+=RI(12,30);
   if(r.prog>=100){r.prog=0;r.stageIdx++;ch=true;if(r.stageIdx>=SPINE.length){r.stageIdx=SPINE.length;r.status=r.pathology&&Math.random()<0.5?'review':'complete';}}else ch=true;});
  if(ch&&view==='active')render();},1200);

function openInspector(r){if(!r)return;let m=document.getElementById('rs-modal');
  if(!m){m=document.createElement('div');m.id='rs-modal';m.className='modal-bk';document.body.appendChild(m);m.onclick=e=>{if(e.target===m)closeInspector();};}
  m.innerHTML=`<div class="modal-card"><button class="modal-x" onclick="RS.close()">&times;</button>
   <div class="modal-head"><i class="fa-solid fa-magnifying-glass-chart" style="color:${AC}"></i> <b>${r.slide}</b> · ${r.tissue} · ${r.model} <span class="pill ${r.status[0]}">${r.status}</span></div>
   ${findingsCard(r)}
   <div class="viewer" style="margin-top:14px"><div><div class="canvas" id="cv2">${window.BK.octImage(true,r.pathology)}</div>
     <div class="tog"><button id="mo1" class="on">Layer overlay</button><button id="mo0">Raw B-scan</button></div></div>
    <div><div class="metric"><span>Layers (mean Dice)</span><b>${r.dice}</b></div>
      <div class="metric"><span>Central subfield</span><b>${r.thickness} µm</b></div>
      <div class="metric"><span>Fluid volume</span><b>${r.fluid} nL</b></div>
      <div class="metric"><span>Findings</span><b>${r.findings.join(', ')||'none'}</b></div>
      <div class="metric"><span>Scan QC</span><b style="color:#34d399">passed</b></div>
      <div style="margin-top:12px"><button class="btn" style="width:100%"><i class="fa-solid fa-file-pdf"></i> Download report</button></div></div></div></div>`;
  m.classList.add('open');
  const o1=document.getElementById('mo1'),o0=document.getElementById('mo0');
  o1.onclick=()=>{document.getElementById('cv2').innerHTML=window.BK.octImage(true,r.pathology);o1.classList.add('on');o0.classList.remove('on');};
  o0.onclick=()=>{document.getElementById('cv2').innerHTML=window.BK.octImage(false,r.pathology);o0.classList.add('on');o1.classList.remove('on');};}
function closeInspector(){const m=document.getElementById('rs-modal');if(m)m.classList.remove('open');}

function welcome(){const m=document.createElement('div');m.className='modal-bk open';m.id='rs-welcome';
  m.innerHTML=`<div class="modal-card" style="max-width:520px;text-align:center"><div style="font-size:34px;margin-bottom:4px">👁️</div>
   <div class="modal-head" style="justify-content:center;margin-bottom:8px">Welcome to&nbsp;<b>RetinaSuite</b></div>
   <p class="sub" style="margin:0 0 4px">An AI-orchestrated OCT pipeline. Tell the assistant what to assess — it plans and runs layer segmentation, fluid detection, and triage.</p>
   <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:16px">
    <button class="btn" id="w-run"><i class="fa-solid fa-bolt"></i> Run a sample pipeline</button>
    <button class="btn g" id="w-talk"><i class="fa-solid fa-wand-magic-sparkles"></i> I'll talk to the assistant</button></div>
   <p class="sub" style="margin-top:14px;font-size:12px">Synthetic demo — nothing is really processed. Navigate freely from the sidebar.</p></div>`;
  document.body.appendChild(m);m.onclick=e=>{if(e.target===m)m.remove();};
  document.getElementById('w-talk').onclick=()=>{m.remove();const o=$('#obj');if(o)o.focus();};
  document.getElementById('w-run').onclick=()=>{m.remove();runSample();};}
function runSample(){setView('new');const o=$('#obj');if(o)o.value=EXAMPLES[0];askAssistant();const iv=setInterval(()=>{if(!streaming){clearInterval(iv);startBatch();}},250);}

window.RS={go:setView,open:id=>openInspector(runs.find(r=>r.slide===id)),close:closeInspector};
document.querySelectorAll('#nav a').forEach(a=>a.onclick=()=>setView(a.dataset.v));
render();welcome();
})();
