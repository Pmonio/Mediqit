import {waitlistColumns,studentColumns,isTest,values,toCSV} from './response-utils.js';
const $=id=>document.getElementById(id);
let records={waitlist:[],students:[]},kind='waitlist',busy=false,loaded=false;
const date=value=>{if(!value)return '—';const d=new Date(value);return Number.isNaN(d.valueOf())?'—':d.toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'});};
function filtered(){const query=$('search').value.trim().toLowerCase(),interest=$('student-filter').value;return records[kind].filter(row=>($('include-test').checked||!isTest(row))&&(kind!=='waitlist'||interest==='all'||(row.studentInterest===true)===(interest==='yes'))&&(!query||Object.values(row).flat().some(v=>String(v).toLowerCase().includes(query)))).sort((a,b)=>String(b.consentedAt||'').localeCompare(String(a.consentedAt||'')));}
function render(){
  const tests=$('include-test').checked;
  const waitlist=records.waitlist.filter(r=>tests||!isTest(r)),students=records.students.filter(r=>tests||!isTest(r));
  $('waitlist-count').textContent=loaded?waitlist.length.toLocaleString():'—';$('students-count').textContent=loaded?students.length.toLocaleString():'—';$('interest-count').textContent=loaded?waitlist.filter(r=>r.studentInterest===true).length.toLocaleString():'—';
  document.querySelectorAll('[role=tab]').forEach(tab=>{const active=tab.dataset.kind===kind;tab.setAttribute('aria-selected',active);tab.tabIndex=active?0:-1;});
  $('results').setAttribute('aria-labelledby',kind==='waitlist'?'tab-waitlist':'tab-students');
  $('search').placeholder=kind==='waitlist'?'Search email addresses…':'Search institution, course or answers…';$('student-filter-label').hidden=kind!=='waitlist';
  const columns=kind==='waitlist'?waitlistColumns:studentColumns,rows=filtered();
  const head=document.createElement('tr');for(const [,title]of columns){const th=document.createElement('th');th.scope='col';th.textContent=title;head.append(th);}$('table-head').replaceChildren(head);
  const body=document.createDocumentFragment();
  // Keep the page responsive for large datasets. Exports include all matching rows.
  for(const row of rows.slice(0,500)){const tr=document.createElement('tr');for(const [key]of columns){const td=document.createElement('td');if(key==='consentedAt')td.textContent=date(row[key]);else if(typeof row[key]==='boolean'){const b=document.createElement('span');b.className='badge'+(row[key]?'':' no');b.textContent=row[key]?'Yes':'No';td.append(b);}else{const list=values(row,key);if(!list.length)td.textContent='—';else for(const value of list){const span=document.createElement('span');span.className='cell-item';span.textContent=value;td.append(span);}}tr.append(td);}body.append(tr);}
  $('table-body').replaceChildren(body);$('empty').hidden=busy||!loaded||rows.length>0;
  $('empty').querySelector('h2').textContent=records[kind].length?'No matching responses':'No responses yet';
  $('empty').querySelector('p').textContent=records[kind].length?'Try a different search or include test entries.':'New submissions will appear here after you refresh.';
  $('shown').textContent=loaded?`${rows.length.toLocaleString()} matching response${rows.length===1?'':'s'}${rows.length>500?' · Showing first 500; export for all':''}`:'Loading…';
  $('export').disabled=busy||!loaded||!rows.length;
}
async function fetchAll(type){let cursor=null;const rows=[],seen=new Set();do{const params=new URLSearchParams({kind:type});if(cursor)params.set('cursor',cursor);const response=await fetch('/api/responses?'+params,{credentials:'same-origin',cache:'no-store'});if(!response.ok){if(response.status===403||response.status===401)throw Error('Your session has expired or this account does not have access. Please sign in again.');throw Error('Responses could not be loaded. Please refresh to try again.');}const data=await response.json();if(!Array.isArray(data.rows))throw Error('Invalid response. Please try again.');rows.push(...data.rows);cursor=data.hasMore?data.cursor:null;if(cursor&&seen.has(cursor))throw Error('Could not finish loading responses. Please retry.');if(cursor)seen.add(cursor);$('status').textContent=`Loading ${type==='waitlist'?'launch list':'student questionnaire'}… ${rows.length} responses read.`;}while(cursor);return rows;}
async function refresh(){if(busy)return;busy=true;loaded=false;records={waitlist:[],students:[]};$('refresh').disabled=true;$('status').className='';$('status').textContent='Loading responses…';render();try{const waitlist=await fetchAll('waitlist');const students=await fetchAll('students');records={waitlist,students};loaded=true;$('status').textContent=`Updated ${new Date().toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'})} · Test entries hidden unless selected.`;}catch(error){$('status').className='error';$('status').textContent=error.message;}finally{busy=false;$('refresh').disabled=false;render();}}
for(const tab of document.querySelectorAll('[role=tab]')){tab.addEventListener('click',()=>{kind=tab.dataset.kind;render();});tab.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();const next=document.querySelector(`[data-kind="${event.key==='Home'?'waitlist':event.key==='End'?'students':kind==='waitlist'?'students':'waitlist'}"]`);next.click();next.focus();}});}
for(const id of ['search','student-filter','include-test'])$(id).addEventListener(id==='search'?'input':'change',render);
$('refresh').addEventListener('click',refresh);
$('export').addEventListener('click',()=>{const blob=new Blob([toCSV(filtered(),kind)],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`mediqit-${kind}-${new Date().toISOString().slice(0,10)}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
// Clear personal data in a page restored from browser back/forward cache.
window.addEventListener('pageshow',event=>{if(event.persisted)refresh();});
window.addEventListener('pagehide',()=>{records={waitlist:[],students:[]};loaded=false;render();});
refresh();
