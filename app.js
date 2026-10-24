(() => {
  const DATA = 'city-unemployment-panel-data.csv';
  const pct = n => `${Number(n).toFixed(2)}%`;
  const points = n => `${Number(n).toFixed(2)} percentage points`;
  const avg = xs => xs.length ? xs.reduce((a,b)=>a+b,0)/xs.length : null;
  const charts = new Map();
  const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const place = r => r.city.endsWith(`, ${r.state}`) ? r.city : `${r.city}, ${r.state}`;
  function parseCSV(text){
    const input=text.replace(/^\uFEFF/,''); const records=[]; let row=[],field='',quoted=false;
    for(let i=0;i<input.length;i++){const ch=input[i];if(quoted){if(ch==='"'&&input[i+1]==='"'){field+='"';i++;}else if(ch==='"')quoted=false;else field+=ch;}else if(ch==='"')quoted=true;else if(ch===','){row.push(field);field='';}else if(ch==='\n'){row.push(field.replace(/\r$/,''));records.push(row);row=[];field='';}else field+=ch;}
    if(field.length||row.length){row.push(field.replace(/\r$/,''));records.push(row);}const headers=records.shift().map(x=>x.trim());
    const required=['City','State','Year','Unemployment Rate (%)'];
    if(required.some(x=>!headers.includes(x))) throw new Error('The CSV does not contain the expected columns.');
    return records.filter(c=>c.some(x=>x.trim())).map((c,i)=>{const row=Object.fromEntries(headers.map((h,j)=>[h,(c[j]||'').trim()]));const rate=Number(row['Unemployment Rate (%)']),year=Number(row.Year);if(!row.City||!row.State||!Number.isFinite(year)||!Number.isFinite(rate))throw new Error(`Invalid or missing value on CSV row ${i+2}.`);return {city:row.City,state:row.State,year,rate};});
  }
  function stats(rows){
    const overall=avg(rows.map(r=>r.rate));
    const y25=avg(rows.filter(r=>r.year===2025).map(r=>r.rate));
    const cities=new Map(); rows.forEach(r=>{const k=place(r);if(!cities.has(k))cities.set(k,[]);cities.get(k).push(r.rate);});
    const means=[...cities].map(([city,xs])=>({city,mean:avg(xs)})).sort((a,b)=>a.mean-b.mean);
    return {overall,y25,low:means[0]||null,high:means.at(-1)||null,means};
  }
  function kpi(label,value,note){return `<article class="card"><div class="kpi-label">${label}</div><div class="kpi-value">${value}</div><div class="kpi-note">${note}</div></article>`;}
  function chart(id,type,labels,series,opts={}){
    const ctx=document.getElementById(id);if(!ctx)return;
    if(charts.has(id))charts.get(id).destroy();
    charts.set(id,new Chart(ctx,{type,data:{labels,datasets:series.map(s=>({label:s.label,data:s.data,backgroundColor:s.color||'#2463a5',borderColor:s.color||'#2463a5',borderWidth:2,fill:false,tension:.25,pointRadius:4}))},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{display:series.length>1||!!opts.legend},tooltip:{callbacks:{label:c=>`${c.dataset.label}: ${pct(c.parsed.y)}`}}},scales:{x:{title:{display:true,text:opts.x||'Year'},grid:{display:false}},y:{beginAtZero:false,title:{display:true,text:opts.y||'Unemployment rate'},ticks:{callback:v=>`${v}%`}}}}}));
  }
  function fullReport(rows){
    const s=stats(rows), years=[2021,2022,2023,2024,2025], annual=years.map(y=>avg(rows.filter(r=>r.year===y).map(r=>r.rate)));
    const delta=annual[4]-annual[0], p=delta>0?'rose':delta<0?'fell':'was unchanged';
    const cityMeans=s.means;
    document.getElementById('report-kpis').innerHTML=[kpi('Overall mean',pct(s.overall),'All 250 valid city-year observations'),kpi('2025 mean',pct(s.y25),'50 cities; 11-month average'),kpi('Lowest city average',`${esc(s.low.city)} · ${pct(s.low.mean)}`,'Mean across 2021–2025'),kpi('Highest city average',`${esc(s.high.city)} · ${pct(s.high.mean)}`,'Mean across 2021–2025')].join('');
    document.getElementById('finding-one').innerHTML=`The cross-city annual mean was ${pct(annual[0])} in 2021 and ${pct(annual[4])} in 2025, a net ${p} of ${points(Math.abs(delta))}. It reached a low of ${pct(Math.min(...annual))} in ${years[annual.indexOf(Math.min(...annual))]} before rising through 2025.`;
    document.getElementById('finding-two').innerHTML=`Across the five-year period, ${esc(s.low.city)} had the lowest city average at ${pct(s.low.mean)}. ${esc(s.high.city)} had the highest at ${pct(s.high.mean)}. These are descriptive comparisons of the supplied city set.`;
    document.getElementById('finding-three').innerHTML=`The 2025 mean was ${pct(s.y25)}, compared with ${pct(annual[3])} in 2024, a change of ${points(annual[4]-annual[3])}. The 2025 value is based on 11 months because October data were not collected during the federal government shutdown.`;
    chart('report-annual','line',years.map(String),[{label:'Mean across cities',data:annual,color:'#2463a5'}],{x:'Year',y:'Mean unemployment rate (%)'});
    const focus=[...cityMeans.slice(0,5),...cityMeans.slice(-5)];
    chart('report-extremes','bar',focus.map(x=>x.city),[{label:'City average, 2021–2025',data:focus.map(x=>x.mean),color:focus.map(x=>x.mean===s.low.mean?'#0e827b':x.mean===s.high.mean?'#b84d4d':'#91a9c3')}],{x:'City',y:'Average unemployment rate (%)'});
    chart('report-latest','bar',['2024','2025'],[{label:'Mean across cities',data:[annual[3],annual[4]],color:['#91a9c3','#d58439']}],{x:'Year',y:'Mean unemployment rate (%)'});
  }
  function dashboard(rows){
    const yf=document.getElementById('year-filter'),cf=document.getElementById('city-filter');
    [...new Set(rows.map(r=>r.year))].sort().forEach(y=>yf.insertAdjacentHTML('beforeend',`<option value="${y}">${y}${y===2025?' · 11 months':''}</option>`));
    const cities=[...new Set(rows.map(place))].sort();cities.forEach(c=>cf.insertAdjacentHTML('beforeend',`<option>${esc(c)}</option>`));
    function update(){
      const year=yf.value,city=cf.value,filtered=rows.filter(r=>(year==='all'||r.year===Number(year))&&(city==='all'||place(r)===city));
      const s=stats(filtered);document.getElementById('dash-kpis').innerHTML=[kpi('Mean in selection',s.overall===null?'—':pct(s.overall),`${filtered.length} valid observations`),kpi('2025 mean',s.y25===null?'Not in selection':pct(s.y25),year==='all'||year==='2025'?'11-month average':'Select 2025 to include'),kpi('Lowest city average',s.low?`${esc(s.low.city)} · ${pct(s.low.mean)}`:'—',`Across selected year${year==='all'?'s':' '}`),kpi('Highest city average',s.high?`${esc(s.high.city)} · ${pct(s.high.mean)}`:'—',`Across selected year${year==='all'?'s':' '}`)].join('');
      const activeYears=[...new Set(filtered.map(r=>r.year))].sort(),means=activeYears.map(y=>avg(filtered.filter(r=>r.year===y).map(r=>r.rate)));
      chart('dash-trend','line',activeYears.map(String),[{label:city==='all'?'Mean across selected cities':city,data:means,color:'#2463a5'}],{x:'Year',y:'Mean unemployment rate (%)'});
      const cityAverages=s.means.slice().sort((a,b)=>a.mean-b.mean);
      chart('dash-cities','bar',cityAverages.map(x=>x.city),[{label:'Average across selected years',data:cityAverages.map(x=>x.mean),color:'#0e827b'}],{x:'City',y:'Average unemployment rate (%)'});
      document.getElementById('selection-note').textContent=`Showing ${filtered.length} city-year observation${filtered.length===1?'':'s'}${year==='all'?' across 2021–2025':` for ${year}`}${year==='2025'?' (11-month average)':''}${city==='all'?'':` for ${city}`}.`;
    }
    yf.addEventListener('change',update);cf.addEventListener('change',update);update();
  }
  async function init(){try{const response=await fetch(DATA);if(!response.ok)throw new Error(`Could not load ${DATA} (${response.status}).`);const rows=parseCSV(await response.text());const pairs=new Set(rows.map(r=>`${r.city}|${r.state}|${r.year}`));if(rows.length!==250||pairs.size!==250)throw new Error(`Expected 250 unique city-year rows; found ${rows.length} rows and ${pairs.size} unique pairs.`);const years=new Set(rows.map(r=>r.year)),cities=new Set(rows.map(r=>`${r.city}|${r.state}`));if(years.size!==5||cities.size!==50)throw new Error('The data coverage does not match 50 cities across five years.');const status=document.getElementById('data-status');if(status)status.textContent=`Verified ${rows.length} unique city-year observations across ${cities.size} cities and ${[...years].sort().join(', ')}. No missing values.`;if(document.body.dataset.page==='report')fullReport(rows);if(document.body.dataset.page==='dashboard')dashboard(rows);}catch(e){document.querySelectorAll('[data-error]').forEach(el=>el.innerHTML=`<div class="error">${esc(e.message)} Check that the CSV is beside the HTML files and serve the folder over HTTP.</div>`);}}
  document.addEventListener('DOMContentLoaded',init);
})();
