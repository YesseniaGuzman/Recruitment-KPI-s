'use strict';
(() => {
try {
const DATA=window.RECRUITMENT_DATA;
if(!DATA||!Array.isArray(DATA.records))throw new Error('Recruitment data did not load.');
const rows=DATA.records;
const $=id=>document.getElementById(id);
const fmt=n=>new Intl.NumberFormat('en-US',{maximumFractionDigits:1}).format(n);
const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sum=(rs,key)=>rs.reduce((s,r)=>s+(r[key]??0),0);
const mean=rs=>rs.length?sum(rs,'days')/rs.length:null;
const median=rs=>{const ds=rs.map(r=>r.days).sort((a,b)=>a-b),n=ds.length;return n?(ds[Math.floor((n-1)/2)]+ds[Math.floor(n/2)])/2:null};
const unique=(rs,key)=>[...new Set(rs.map(r=>r[key]))].sort();
const date=v=>v?new Date(v+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'}):'—';
const monthName=m=>new Date(m+'-01T00:00:00').toLocaleDateString('en-US',{month:'short'});
const months=Array.from({length:8},(_,i)=>`2026-${String(i+1).padStart(2,'0')}`);
const state={state:'',city:'',month:'',group:'state',sort:'posted-desc',page:0};
const filtered=()=>rows.filter(r=>(!state.state||r.state===state.state)&&(!state.city||`${r.city}|${r.state}`===state.city)&&(!state.month||r.posted.startsWith(state.month)));
const eligibleRows=rs=>rs.filter(r=>r.eligible);
const knownAmounts=rs=>rs.filter(r=>r.amount!==null);
const missingAmounts=rs=>rs.filter(r=>r.sponsored==='Yes'&&r.amount===null);
const empty=message=>`<div class="empty">${message}</div>`;
function populateCities(){const available=rows.filter(r=>!state.state||r.state===state.state);$('city').innerHTML='<option value="">All cities</option>';const map=new Map(available.map(r=>[`${r.city}|${r.state}`,r]));[...map].sort((a,b)=>a[0].localeCompare(b[0])).forEach(([v,r])=>$('city').add(new Option(state.state?r.city:`${r.city}, ${r.state}`,v)));if(!map.has(state.city))state.city='';$('city').value=state.city;}
function renderKpis(rs){const es=eligibleRows(rs),completed=rs.filter(r=>r.status==='Completed'),amounts=knownAmounts(rs),missing=missingAmounts(rs);const cards=[
 {label:'Posting records',value:rs.length,desc:`${unique(rs,'jobId').length} unique posting IDs · ${unique(rs,'state').length} states`,symbol:'▤'},
 {label:'Completed status',value:completed.length,desc:rs.length?`${fmt(completed.length/rs.length*100)}% of selected posting records`:'No records match these filters',symbol:'✓'},
 {label:'Average time to fill',value:es.length?fmt(mean(es))+' <small>days</small>':'—',desc:es.length?`${es.length} eligible records · median ${fmt(median(es))} days`:'No eligible completed records',symbol:'◷',featured:true},
 {label:'Recorded sponsorship',value:amounts.length?money(sum(amounts,'amount')):'—',desc:missing.length?`${missing.length} sponsored records missing an amount`:`${amounts.length} records with an amount entered`,symbol:'＄'}
 ];$('kpis').innerHTML=cards.map(c=>`<article class="kpi ${c.featured?'featured':''}"><div class="kpi-top">${c.label}<span class="kpi-symbol" aria-hidden="true">${c.symbol}</span></div><div class="kpi-value">${c.value}</div><div class="kpi-desc">${c.desc}</div></article>`).join('');}
function renderMonthly(rs){
 if(!rs.length){$('monthly').innerHTML=empty('No records match these filters.');return;}
 const series=months.map(m=>({month:m,opened:rs.filter(r=>r.posted.startsWith(m)).length,completed:rs.filter(r=>r.status==='Completed'&&r.outcome?.startsWith(m)).length}));
 const max=Math.max(4,...series.flatMap(d=>[d.opened,d.completed])),step=Math.ceil(max/4),top=step*4,w=700,h=242,left=30,right=12,bottom=31,plotH=184,groupW=(w-left-right)/8;
 let svg=`<svg viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="monthly-title monthly-desc"><title id="monthly-title">Monthly recruitment activity</title><desc id="monthly-desc">${series.map(d=>`${monthName(d.month)}: ${d.opened} opened, ${d.completed} completed status`).join('; ')}</desc>`;
 for(let i=0;i<=4;i++){const y=15+plotH-i*plotH/4;svg+=`<line class="chart-grid" x1="${left}" y1="${y}" x2="${w-right}" y2="${y}"/><text class="chart-text" x="${left-9}" y="${y+4}" text-anchor="end">${i*step}</text>`;}
 series.forEach((d,i)=>{const x=left+groupW*(i+.5);[['opened','#20b5a4',-22],['completed','#142c46',3]].forEach(([key,color,dx])=>{const value=d[key],height=value/top*plotH,y=15+plotH-height;svg+=`<rect x="${x+dx}" y="${y}" width="19" height="${height}" rx="3" fill="${color}"><title>${monthName(d.month)} ${key==='opened'?'opened':'completed status'}: ${value}</title></rect>${value?`<text class="chart-value" x="${x+dx+9.5}" y="${y-7}" text-anchor="middle">${value}</text>`:''}`;});svg+=`<text class="chart-text" x="${x}" y="${h-14}" text-anchor="middle">${monthName(d.month)}</text>`;});
 $('monthly').innerHTML=svg+`</svg><div class="chart-caption">Completed counts follow source status${rs.some(r=>r.conflict)?', including one documented removal':''}. Months end at the latest recorded activity.</div>`;
}
function renderOutcomes(rs){if(!rs.length){$('outcomes').innerHTML=empty('No records match these filters.');return;}const completed=rs.filter(r=>r.status==='Completed').length,removed=rs.filter(r=>r.status==='Removed').length,hold=rs.filter(r=>r.status==='On Hold').length,n=rs.length,p=n?completed/n*100:0,q=n?(completed+removed)/n*100:0;
 $('outcomes').innerHTML=`<div class="outcome-top"><div class="donut" style="background:conic-gradient(#007f79 0% ${p}%,#a5b1bf ${p}% ${q}%,#eab963 ${q}% 100%)" role="img" aria-label="${completed} Completed, ${removed} Removed, ${hold} On Hold"><div class="donut-center"><strong>${n?fmt(p)+'%':'—'}</strong><span>completed status</span></div></div><div class="status-list">${[['Completed',completed,'teal'],['Removed',removed,'gray'],['On Hold',hold,'gold']].map(([label,count,color])=>`<div class="status-row"><i class="key ${color}"></i><span>${label}</span><strong>${count}</strong></div>`).join('')}</div></div><div class="outcome-note"><b>No records marked Open.</b> Historical outcomes do not establish today’s vacancy count.${rs.some(r=>r.conflict)?' One Completed record is documented as a removal.':''}</div>`;
}
function grouped(rs,key){const map=new Map();for(const r of rs){const k=key(r);if(!map.has(k))map.set(k,[]);map.get(k).push(r);}return [...map].map(([label,all])=>({label,all,es:eligibleRows(all),avg:mean(eligibleRows(all))})).sort((a,b)=>(a.avg??Infinity)-(b.avg??Infinity)||a.label.localeCompare(b.label));}
function bar(g,max,overall){return `<div class="bar-row"><div class="bar-label"><span class="label">${esc(g.label)}</span><span class="value">${fmt(g.avg)} <small>days</small></span></div><div class="bar-track"><div class="bar-fill ${g.avg<=overall?'faster':''}" style="width:${Math.max(1,g.avg/max*100)}%"></div></div><div class="bar-meta">${g.es.length} eligible completed ${g.es.length===1?'record · limited history':'records'} · ${g.all.length} total posting${g.all.length===1?'':'s'}</div></div>`;}
function renderLocations(rs){const es=eligibleRows(rs),overall=mean(es),groups=grouped(rs,r=>state.group==='state'?r.state:`${r.city}, ${r.state}`),valid=groups.filter(g=>g.es.length),invalid=groups.filter(g=>!g.es.length),max=Math.max(1,...valid.map(g=>g.avg));
 $('locations').innerHTML=(valid.length?valid.map(g=>bar(g,max,overall)).join(''):empty('No eligible completed records for this selection.'))+(valid.length?`<div class="benchmark">Selected-record average <b>${fmt(overall)} days</b> · teal indicates at or below average</div>`:'')+(invalid.length?`<p class="no-history"><b>No qualifying completions:</b> ${invalid.map(g=>`${esc(g.label)} (${g.all.length} records)`).join('; ')}</p>`:'');
 $('by-state').classList.toggle('active',state.group==='state');$('by-city').classList.toggle('active',state.group==='city');$('by-state').setAttribute('aria-pressed',String(state.group==='state'));$('by-city').setAttribute('aria-pressed',String(state.group==='city'));
}
function renderRoles(rs){const es=eligibleRows(rs),groups=grouped(rs,r=>r.family),repeat=groups.filter(g=>g.es.length>=2),single=groups.filter(g=>g.es.length===1),none=groups.filter(g=>!g.es.length),max=Math.max(1,...groups.map(g=>g.avg||0));
 $('role-insight').innerHTML=repeat.length?`<strong>${esc(repeat[0].label)}</strong> has the shortest observed average among roles with at least two completions: <strong>${fmt(repeat[0].avg)} days</strong> across ${repeat[0].es.length} records.`:'This selection has no role with two or more eligible completions. Single outcomes are shown below.';
 $('roles').innerHTML=repeat.map(g=>bar(g,max,mean(es))).join('')+(single.length?`<details class="single-results" ${repeat.length?'':'open'}><summary>${single.length} roles with one eligible completion</summary><div>${single.map(g=>bar(g,max,mean(es))).join('')}</div></details>`:'')+(!es.length?empty('No eligible completions to compare.'):'')+(none.length?`<p class="no-history"><b>No qualifying completions:</b> ${none.map(g=>esc(g.label)).join('; ')}</p>`:'');
}
function renderSpend(rs){const known=knownAmounts(rs),yes=rs.filter(r=>r.sponsored==='Yes'),reportedYes=yes.filter(r=>r.amount!==null),missing=missingAmounts(rs),unknown=rs.filter(r=>r.sponsored==='Unknown'),coverage=yes.length?reportedYes.length/yes.length*100:0;
 $('spend-summary').innerHTML=`<div class="spend-big">${known.length?money(sum(known,'amount')):'—'}</div><p class="spend-detail">${known.length} records with recorded amounts</p><div class="coverage"><strong>${reportedYes.length} of ${yes.length}</strong> sponsored records have amounts</div><div class="coverage-track" role="img" aria-label="${fmt(coverage)} percent amount coverage"><span style="width:${coverage}%"></span></div><p class="spend-warning">${missing.length?`${missing.length} sponsored records have missing amounts.`:'No missing amounts among records marked sponsored.'}${unknown.length?` Sponsorship status is unknown on ${unknown.length} records.`:''}</p>`;
 const ms=months.map(m=>({month:m,rs:known.filter(r=>r.sponsoredDate?.startsWith(m))})).filter(g=>g.rs.length),max=Math.max(1,...ms.map(g=>sum(g.rs,'amount')));
 $('spend-monthly').innerHTML=ms.length?ms.map(g=>`<div class="spend-month-row"><span>${monthName(g.month)}</span><div class="bar-track"><div class="bar-fill faster" style="width:${sum(g.rs,'amount')/max*100}%"></div></div><strong>${money(sum(g.rs,'amount'))}</strong></div>`).join(''):empty('No sponsorship amounts recorded.');
 const undated=known.filter(r=>!r.sponsoredDate);if(undated.length)$('spend-monthly').innerHTML+=`<div class="mini-row"><span>Month not recorded</span><strong>${money(sum(undated,'amount'))}</strong></div>`;
 const dateFlags=rs.filter(r=>r.amount!==null&&r.sponsoredDate&&r.outcome&&r.sponsoredDate>r.outcome);if(dateFlags.length)$('spend-monthly').innerHTML+=`<p class="spend-warning">${dateFlags.length} sponsorship dates occur after completion; amounts are grouped as entered.</p>`;
 const groups=unique(rs,'state').map(name=>({name,rs:rs.filter(r=>r.state===name)})).sort((a,b)=>sum(b.rs,'amount')-sum(a.rs,'amount'));
 $('spend-states').innerHTML=groups.length?groups.map(g=>`<div class="mini-row"><span>${esc(g.name)}</span><strong>${knownAmounts(g.rs).length?money(sum(g.rs,'amount')):'Not recorded'}</strong></div>`).join(''):empty('No matching records.');
}
function renderRecords(rs){const sorted=[...rs];if(state.sort==='posted-desc')sorted.sort((a,b)=>b.posted.localeCompare(a.posted)||b.record-a.record);else if(state.sort==='days-asc')sorted.sort((a,b)=>(a.days??Infinity)-(b.days??Infinity));else if(state.sort==='days-desc')sorted.sort((a,b)=>(b.days??-Infinity)-(a.days??-Infinity));else sorted.sort((a,b)=>(b.amount??-Infinity)-(a.amount??-Infinity));
 const pages=Math.max(1,Math.ceil(rs.length/10));state.page=Math.min(state.page,pages-1);const start=state.page*10,page=sorted.slice(start,start+10);
 $('records').innerHTML=page.length?page.map(r=>`<tr><td><strong>${esc(r.title)}</strong><span class="cell-meta">ID ${esc(r.jobId)} · source row ${r.sourceRow}</span>${r.flags.filter(x=>!x.includes('amount missing')).map(x=>`<span class="flag">${esc(x)}</span>`).join('')}</td><td>${esc(r.city)}<span class="cell-meta">${esc(r.state)}</span></td><td>${date(r.posted)}</td><td>${date(r.outcome)}</td><td><span class="status ${r.status==='Completed'?'completed':r.status==='Removed'?'removed':'hold'}">${esc(r.status)}</span></td><td class="numeric">${r.days??'—'}<span class="cell-meta">${r.eligible?'Fill proxy':r.days!==null?'Excluded from fill proxy':'No outcome date'}</span></td><td class="numeric">${r.amount!==null?money(r.amount):'—'}<span class="cell-meta">${r.amount!==null?'Recorded amount':r.sponsored==='Yes'?'Amount missing':r.sponsored==='No'?'Not sponsored':'Status unknown'}</span></td></tr>`).join(''):'<tr><td colspan="7" class="empty">No records match these filters. Reset filters to see all records.</td></tr>';
 $('record-caption').textContent=`${rs.length} posting episodes in this selection · all dates in 2026`;
 $('table-footer').innerHTML=`<span>${rs.length?`${start+1}–${Math.min(start+10,rs.length)} of ${rs.length} records`:'0 records'} · days stop at the recorded outcome</span><div class="pagination"><button id="previous" ${state.page===0?'disabled':''} aria-label="Previous records">← Previous</button><span>${state.page+1} / ${pages}</span><button id="next" ${state.page===pages-1?'disabled':''} aria-label="Next records">Next →</button></div>`;
 $('previous').onclick=()=>{state.page--;renderRecords(filtered())};$('next').onclick=()=>{state.page++;renderRecords(filtered())};
}
function render(){const rs=filtered();$('scope').textContent=`${rs.length} of ${rows.length} posting records · ${state.state||'All states'}${state.city?' · '+state.city.split('|')[0]:''}${state.month?' · posted '+monthName(state.month)+' 2026':''}`;renderKpis(rs);renderMonthly(rs);renderOutcomes(rs);renderLocations(rs);renderRoles(rs);renderSpend(rs);renderRecords(rs);}
for(const field of ['state','city','month']) $(field).addEventListener('change',()=>{state[field]=$(field).value;state.page=0;if(field==='state')populateCities();render()});
$('reset').onclick=()=>{Object.assign(state,{state:'',city:'',month:'',page:0});for(const f of ['state','city','month'])$(f).value='';populateCities();render()};
$('sort').onchange=()=>{state.sort=$('sort').value;state.page=0;renderRecords(filtered())};
$('by-state').onclick=()=>{state.group='state';renderLocations(filtered())};$('by-city').onclick=()=>{state.group='city';renderLocations(filtered())};
$('state').innerHTML='<option value="">All states</option>';
for(const name of unique(rows,'state'))$('state').add(new Option(name,name));
$('month').innerHTML='<option value="">All months</option>';
for(const month of [...new Set(rows.map(r=>r.posted.slice(0,7)))].sort())$('month').add(new Option(new Date(month+'-01T00:00:00').toLocaleDateString('en-US',{month:'long',year:'numeric'}),month));
for(const field of ['state','month'])$(field).value='';
$('sort').value=state.sort;
populateCities();render();
$('dashboard-status').hidden=true;

// The optional browser tool uses exactly the same selectors and rendering as the visible UI.
if(document.modelContext?.registerTool){
 const lifecycle=new AbortController();
 try{Promise.resolve(document.modelContext.registerTool({name:'filter_recruitment_dashboard',title:'Filter recruitment metrics',description:'Set state, city and posting-month filters on the recruitment dashboard, then return the displayed metrics. Empty strings clear filters. City must use the exact displayed city and state key.',inputSchema:{type:'object',properties:{state:{type:'string',enum:['',...unique(rows,'state')]},city:{type:'string',enum:['',...unique(rows.map(r=>({city:`${r.city}|${r.state}`})),'city')]},month:{type:'string',enum:['',...unique(rows.map(r=>({month:r.posted.slice(0,7)})),'month')]}},additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['state','city','month'].includes(k)))throw new Error('Invalid filter object.');
 const next={state:input.state??state.state,city:input.city??state.city,month:input.month??state.month};
 if(input.state!==undefined&&input.city===undefined&&next.city&&!rows.some(r=>`${r.city}|${r.state}`===next.city&&(!next.state||r.state===next.state)))next.city='';
 if(!['',...unique(rows,'state')].includes(next.state))throw new Error('Unknown state.');
 if(!['',...unique(rows.map(r=>({month:r.posted.slice(0,7)})),'month')].includes(next.month))throw new Error('Unknown posting month.');
 if(next.city&&!rows.some(r=>`${r.city}|${r.state}`===next.city&&(!next.state||r.state===next.state)))throw new Error('City does not belong to the selected state.');
 Object.assign(state,next,{page:0});$('state').value=state.state;populateCities();$('month').value=state.month;render();const rs=filtered(),es=eligibleRows(rs);return{filters:next,postingRecords:rs.length,completedStatus:rs.filter(r=>r.status==='Completed').length,eligibleCompleted:es.length,averageDays:mean(es),recordedSponsorship:knownAmounts(rs).length?sum(rs,'amount'):null};
 }},{signal:lifecycle.signal})).catch(()=>{});window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});}catch{/* Normal browser controls remain available. */}
}
}catch(error){
 console.error('Recruitment dashboard initialization failed:',error);
 const status=document.getElementById('dashboard-status');
 if(status){status.hidden=false;status.textContent='The dashboard could not load. Reload this page, or open the standalone dashboard file.';status.setAttribute('role','alert');}
}
})();
