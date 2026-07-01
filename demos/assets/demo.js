/* Bartek LLC demo engine — 100% synthetic data, no processing actually runs. */
(function(){
const BK = window.BK = {};
const R = (a,b)=>a+Math.random()*(b-a);
const RI = (a,b)=>Math.floor(R(a,b+1));
const pick = a=>a[RI(0,a.length-1)];
const pad = n=>String(n).padStart(2,'0');

const IDS = ()=> RI(100,999)+'-'+RI(1000000,9999999)+'-'+RI(1000000,9999999);
const STAGES_LEFT = s => Math.max(0, s.stages.length - s.stageIdx);

// ---- synthetic image renderers (return SVG markup) ----
BK.octImage = function(withOverlay, pathology){
  const W=560,H=300, cx=[];
  // base gradient bg
  let s=`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="oct" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#0a1018"/><stop offset="1" stop-color="#101b28"/></linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#oct)"/>`;
  // retinal layers as wavy bands
  const nL=7, base=90, amp=R(6,14), ph=R(0,6);
  const layerY = (i,x)=> base + i*22 + Math.sin(x/70+ph+i*0.4)*amp*(1-i*0.05) + (i>3?18:0);
  const cols=['#3a5a78','#5b7a97','#8aa6bf','#c3d3e0','#7f97ad','#b98f5a','#6d523a'];
  for(let i=0;i<nL;i++){
    let d=`M0 ${layerY(i,0)}`; for(let x=8;x<=W;x+=8)d+=` L${x} ${layerY(i,x)}`;
    d+=` L${W} ${layerY(i,W)+16} L0 ${layerY(0,0)+16} Z`;
    s+=`<path d="${d}" fill="${cols[i]}" opacity="${0.5+i*0.04}"/>`;
  }
  // pathology: fluid pocket
  if(pathology){ const px=R(180,380),py=R(150,200); s+=`<ellipse cx="${px}" cy="${py}" rx="${R(35,60)}" ry="${R(14,24)}" fill="#050a10" opacity="0.85"/>`; }
  // overlay layer boundaries
  if(withOverlay){
    const ov=[['#16e0c0',0,'ILM'],['#ffd24d',5,'RPE'],['#ff6b6b',6,'BM']];
    ov.forEach(([c,li])=>{ let d=`M0 ${layerY(li,0)}`; for(let x=8;x<=W;x+=8)d+=` L${x} ${layerY(li,x)}`; s+=`<path d="${d}" fill="none" stroke="${c}" stroke-width="2.2"/>`; });
    if(pathology) s+=`<text x="12" y="24" fill="#ff6b6b" font-size="12" font-family="monospace">⚠ fluid detected</text>`;
  }
  return s+`</svg>`;
};
BK.pathoImage = function(withOverlay){
  const W=560,H=300; let s=`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"><rect width="${W}" height="${H}" fill="#efd9e6"/>`;
  // stroma washes
  for(let i=0;i<40;i++) s+=`<ellipse cx="${R(0,W)}" cy="${R(0,H)}" rx="${R(20,70)}" ry="${R(14,44)}" fill="#e6b9cf" opacity="0.28"/>`;
  // nuclei (H&E purple)
  let nuclei='';for(let i=0;i<420;i++){const x=R(0,W),y=R(0,H);nuclei+=`<circle cx="${x}" cy="${y}" r="${R(1.6,3.6)}" fill="#5b2a6e" opacity="${R(.5,.9)}"/>`;}
  s+=nuclei;
  if(withOverlay){
    // tumor region polygon
    const cx=R(160,380),cy=R(110,200),pts=[];for(let a=0;a<12;a++){const r=R(55,95);pts.push(`${cx+Math.cos(a/12*6.28)*r},${cy+Math.sin(a/12*6.28)*r*0.7}`);}
    s+=`<polygon points="${pts.join(' ')}" fill="#c0392b" opacity="0.22" stroke="#c0392b" stroke-width="2"/>`;
    s+=`<text x="${cx-30}" y="${cy}" fill="#7a1f16" font-size="12" font-family="monospace" opacity="0.9">tumor</text>`;
    // grid patches
    for(let gx=0;gx<W;gx+=70)for(let gy=0;gy<H;gy+=70) s+=`<rect x="${gx}" y="${gy}" width="70" height="70" fill="none" stroke="#16a3a3" stroke-width="0.6" opacity="0.35"/>`;
  }
  return s+`</svg>`;
};
BK.genericImage = function(withOverlay){ return BK.octImage(withOverlay,false); };

// ---- runs ----
BK.newRun = function(cfg){
  const st = Math.random()<0.12?'review':(Math.random()<0.5?'complete':(Math.random()<0.7?'processing':'queued'));
  const stageIdx = st==='complete'?cfg.stages.length: st==='queued'?0: RI(1,cfg.stages.length-1);
  return {id:IDS(), case: cfg.casePrefix+'-'+RI(1000,9999), model: pick(cfg.models).name,
    status:st, stageIdx, stages:cfg.stages, prog: st==='complete'?100: st==='queued'?0: RI(10,90),
    metrics: cfg.metrics(), pathology: Math.random()<0.35, t: Date.now()-RI(0,7200)*1000 };
};

BK.mount = function(cfg){
  document.title = cfg.title+' — Demo | BARTEK LLC';
  document.body.className='bk';
  document.body.innerHTML = `
  <div class="bk-demo-banner">🔬 Interactive demo — <b>synthetic data only</b>. Not a clinical system; nothing is actually processed. Illustrates architecture &amp; workflow. © Bartek LLC</div>
  <div class="bk-topbar"><div class="bk-brand"><span class="dot"></span>BARTEK&nbsp;LLC <small>| ${cfg.platform}</small></div>
    <div class="bk-nav"><a href="index.html">All demos</a><a href="../">bartekllc.org</a></div></div>
  <div class="bk-wrap">
    <div class="bk-stats" id="bk-stats"></div>
    <div class="bk-grid">
      <div>
        <div class="bk-card"><h3>Submit a run</h3>
          <div class="bk-field"><label>Modality</label><select>${cfg.modalityOpts.map(o=>`<option>${o}</option>`).join('')}</select></div>
          <div class="bk-drop" id="bk-drop"><i class="fa-solid fa-cloud-arrow-up"></i> Drop ${cfg.dropLabel} (demo)</div>
          <button class="bk-btn" id="bk-submit" style="margin-top:12px"><i class="fa-solid fa-play"></i> Queue run</button>
        </div>
        <div class="bk-card bk-ai"><h3>AI model recommendation</h3><div id="bk-ai-recs"></div>
          <div style="font-size:11.5px;color:#69788c">Auto-suggested per case by the pipeline's LLM assistant.</div></div>
      </div>
      <div>
        <div class="bk-card"><h3>Run queue — live</h3>
          <table class="bk-runs"><thead><tr><th>Case</th><th>Model</th><th>Status</th><th>Progress</th><th>Time</th></tr></thead>
          <tbody id="bk-runbody"></tbody></table></div>
        <div class="bk-card"><h3>Result &amp; QC — <span id="bk-selcase" style="text-transform:none;color:#1a2230"></span></h3>
          <div class="bk-viewer">
            <div><div class="bk-canvas" id="bk-canvas"></div>
              <div class="bk-toggle"><button id="bk-ov-on" class="on">Overlay on</button><button id="bk-ov-off">Raw image</button></div></div>
            <div><div class="bk-legend" id="bk-legend" style="margin-bottom:12px"></div><div id="bk-metrics"></div></div>
          </div></div>
      </div>
    </div>
  </div>
  <div class="bk-foot">${cfg.footer}</div>`;
  BK.init(cfg);
};

BK.init = function(cfg){
  document.body.classList.add('bk');
  const runs = Array.from({length:14},()=>BK.newRun(cfg));
  let sel = runs.find(r=>r.status==='complete')||runs[0];
  let overlay=true;

  const el = id=>document.getElementById(id);
  const fmtTime = t=>{const d=new Date(t);return pad(d.getHours())+':'+pad(d.getMinutes());};

  function stats(){
    const done=runs.filter(r=>r.status==='complete').length;
    const proc=runs.filter(r=>r.status==='processing').length;
    const rev=runs.filter(r=>r.status==='review').length;
    el('bk-stats').innerHTML = [
      ['Runs today', cfg.perDay, ''],['Processing', proc, 'processing'],
      ['Completed', done, 'complete'],['Needs review', rev, 'review']
    ].map(([l,n,c])=>`<div class="bk-stat"><div class="n" style="color:${c==='complete'?'#1c7a4e':c==='processing'?'#a5720c':c==='review'?'#b23b3b':'#0f2540'}">${n}</div><div class="l">${l}</div></div>`).join('');
  }
  function table(){
    el('bk-runbody').innerHTML = runs.map(r=>`<tr data-id="${r.id}" class="${r===sel?'sel':''}">
      <td><code style="font-size:11px">${r.case}</code></td>
      <td>${r.model}</td>
      <td><span class="pill ${r.status}">${r.status}</span></td>
      <td style="min-width:90px"><div class="bar"><i style="width:${r.prog}%"></i></div></td>
      <td style="color:#69788c">${fmtTime(r.t)}</td></tr>`).join('');
    [...el('bk-runbody').querySelectorAll('tr')].forEach(tr=>tr.onclick=()=>{sel=runs.find(r=>r.id===tr.dataset.id);draw();});
  }
  function viewer(){
    const img = cfg.image(overlay, sel.pathology);
    el('bk-canvas').innerHTML = img;
    el('bk-metrics').innerHTML = sel.metrics.map(m=>`<div class="bk-metric"><span>${m[0]}</span><b>${m[1]}</b></div>`).join('');
    el('bk-legend').innerHTML = cfg.legend.map(l=>`<div><span class="sw" style="background:${l[1]}"></span>${l[0]}</div>`).join('');
    el('bk-selcase').textContent = sel.case+' · '+sel.model+(sel.pathology?' · ⚠ finding':'');
  }
  function ai(){
    const recs = cfg.models.slice(0,3).map((m,i)=>({name:m.name, why:m.why, conf:(94-i*11-RI(0,4))}));
    el('bk-ai-recs').innerHTML = recs.map((r,i)=>`<div class="rec"><i class="fa-solid fa-robot" style="color:#0b6e4f"></i>
      <div><b>${r.name}</b><br><span style="font-size:11.5px;color:#69788c">${r.why}</span></div>
      <span class="conf">${r.conf}%</span></div>`).join('');
  }
  function draw(){stats();table();viewer();ai();}

  // controls
  el('bk-submit').onclick=()=>{const r=BK.newRun(cfg);r.status='queued';r.prog=0;r.stageIdx=0;r.t=Date.now();runs.unshift(r);sel=r;draw();};
  el('bk-ov-on').onclick=()=>{overlay=true;el('bk-ov-on').classList.add('on');el('bk-ov-off').classList.remove('on');viewer();};
  el('bk-ov-off').onclick=()=>{overlay=false;el('bk-ov-off').classList.add('on');el('bk-ov-on').classList.remove('on');viewer();};

  // "processing" animation — advance runs over time
  setInterval(()=>{
    let changed=false;
    runs.forEach(r=>{
      if(r.status==='queued' && Math.random()<0.3){r.status='processing';r.prog=5;changed=true;}
      else if(r.status==='processing'){r.prog=Math.min(100,r.prog+RI(4,16));if(r.prog>=100){r.status=r.pathology&&Math.random()<0.5?'review':'complete';}changed=true;}
    });
    if(changed){stats();table();}
  },1400);

  draw();
};
})();
