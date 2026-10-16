import {waitlistColumns,isTest,values,toCSV} from './response-utils.js';
const $=id=>document.getElementById(id);
let records={waitlist:[],students:[]},kind='waitlist',busy=false,loaded=false;
const date=value=>{if(!value)return 'Not recorded';const d=new Date(value);return Number.isNaN(d.valueOf())?'Not recorded':d.toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'});};
const node=(tag,text,className)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;};
function filtered(){const query=$('search').value.trim().toLowerCase(),interest=$('student-filter').value;return records[kind].filter(row=>($('include-test').checked||!isTest(row))&&(kind!=='waitlist'||interest==='all'||(row.studentInterest===true)===(interest==='yes'))&&(!query||Object.values(row).flat().some(v=>String(v).toLowerCase().includes(query)))).sort((a,b)=>String(b.consentedAt||'').localeCompare(String(a.consentedAt||'')));}
const badge=(text,on)=>node('span',text,'badge'+(on?'':' no'));
function showDetail(row){
 $('detail-title').textContent=row.institution||'Student response';
 $('detail-meta').textContent=`Submitted ${date(row.consentedAt)}`;
 const questions=[['institution','1. Which institution do you attend?'],['course','2. What course are you studying?'],['equipment','3. What equipment do you need?'],['findingChallenge','4. What challenges do you face finding the right equipment?'],['buyingChallenge','5. What challenges do you face buying the equipment you need?']];
 const body=document.createDocumentFragment();
 for(const [key,question]of questions){const section=node('section',undefined,'answer');section.append(node('h3',question));const entries=values(row,key);if(entries.length>1||Array.isArray(row[key])){const ul=node('ul');for(const entry of entries)ul.append(node('li',entry));section.append(ul);}else section.append(node('p',entries[0]||'Not recorded'));body.append(section);}
 $('detail-answers').replaceChildren(body);$('detail').showModal();$('close-detail').focus();
}
function detailButton(row){const button=node('button','View answers →','view-button');button.type='button';button.setAttribute('aria-label',`View answers from ${row.institution||'student'}`);button.addEventListener('click',()=>showDetail(row));return button;}
function render(){
 const tests=$('include-test').checked;
 const waitlist=records.waitlist.filter(r=>tests||!isTest(r)),students=records.students.filter(r=>tests||!isTest(r));
 $('waitlist-count').textContent=loaded?waitlist.length.toLocaleString():'—';$('students-count').textContent=loaded?students.length.toLocaleString():'—';$('interest-count').textContent=loaded?waitlist.filter(r=>r.studentInterest===true).length.toLocaleString():'—';
 document.querySelectorAll('[role=tab]').forEach(tab=>{const active=tab.dataset.kind===kind;tab.setAttribute('aria-selected',active);tab.tabIndex=active?0:-1;});
 $('results').setAttribute('aria-labelledby',kind==='waitlist'?'tab-waitlist':'tab-students');
 $('search').placeholder=kind==='waitlist'?'Search email addresses…':'Search institution, course or answers…';$('student-filter-label').hidden=kind!=='waitlist';
 const columns=kind==='waitlist'?waitlistColumns:[['institution','Institution'],['course','Course'],['consentedAt','Submitted'],['detail','Response']];
 const rows=filtered(),table=$('table-head').closest('table');table.classList.toggle('student-table',kind==='students');
 const head=node('tr');for(const [,title]of columns){const th=node('th',title);th.scope='col';head.append(th);}$('table-head').replaceChildren(head);
 const body=document.createDocumentFragment(),cards=document.createDocumentFragment();
 for(const row of rows.slice(0,500)){
  const tr=node('tr');for(const [key]of columns){const td=node('td');if(key==='detail')td.append(detailButton(row));else if(key==='consentedAt')td.textContent=date(row[key]);else if(typeof row[key]==='boolean')td.append(badge(row[key]?'Yes':'No',row[key]));else{const list=values(row,key);if(!list.length)td.textContent='Not recorded';else for(const value of list)td.append(node('span',value,'cell-item'));}tr.append(td);}body.append(tr);
  const card=node('article',undefined,'card-summary');card.append(node('h3',kind==='students'?row.institution||'Institution not recorded':row.email||'Email not recorded'));
  if(kind==='students'){card.append(node('p',values(row,'course').join(', ')||'Course not recorded','course'),node('p',date(row.consentedAt)),detailButton(row));}
  else{card.append(node('p','Joined '+date(row.consentedAt)));const tags=node('div',undefined,'tags');for(const [key,label]of [['studentInterest','Student kits'],['updatesConsent','Product updates'],['launchConsent','Launch consent']])tags.append(badge(`${label}: ${typeof row[key]==='boolean'?(row[key]?'Yes':'No'):'Not recorded'}`,row[key]===true));card.append(tags);}
  cards.append(card);
 }
 $('table-body').replaceChildren(body);$('response-cards').replaceChildren(cards);$('empty').hidden=busy||!loaded||rows.length>0;
 $('empty').querySelector('h2').textContent=records[kind].length?'No matching responses':'No responses yet';$('empty').querySelector('p').textContent=records[kind].length?'Try a different search or include test entries.':'New submissions will appear here after you refresh.';
 $('shown').textContent=loaded?`${rows.length.toLocaleString()} matching response${rows.length===1?'':'s'}${rows.length>500?' · Showing first 500; export for all':''}`:'Responses unavailable';
 $('export').disabled=busy||!loaded||!rows.length;
}
async function fetchAll(type){let cursor=null;const rows=[],seen=new Set();do{const params=new URLSearchParams({kind:type});if(cursor)params.set('cursor',cursor);const response=await fetch('/api/responses?'+params,{credentials:'same-origin',cache:'no-store'});if(!response.ok){if([401,403,404].includes(response.status))throw Error('Please sign in with your authorised Mediqit account to view responses.');throw Error('Responses could not be loaded. Please refresh to try again.');}const data=await response.json();if(!Array.isArray(data.rows))throw Error('Invalid response. Please try again.');rows.push(...data.rows);cursor=data.hasMore?data.cursor:null;if(data.hasMore&&!cursor||cursor&&seen.has(cursor))throw Error('Could not finish loading responses. Please retry.');if(cursor)seen.add(cursor);$('status').textContent=`Loading ${type==='waitlist'?'launch list':'student questionnaire'}… ${rows.length} responses read.`;}while(cursor);return rows;}
async function refresh(){if(busy)return;if($('detail').open)$('detail').close();busy=true;loaded=false;records={waitlist:[],students:[]};$('refresh').disabled=true;$('status').className='';$('status').textContent='Loading responses…';render();try{const waitlist=await fetchAll('waitlist');const students=await fetchAll('students');records={waitlist,students};loaded=true;$('status').textContent=`Updated ${new Date().toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'})} · Refresh for new submissions.`;}catch(error){$('status').className='error';$('status').textContent=error.message;}finally{busy=false;$('refresh').disabled=false;render();}}
for(const tab of document.querySelectorAll('[role=tab]')){tab.addEventListener('click',()=>{kind=tab.dataset.kind;render();});tab.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();const next=document.querySelector(`[data-kind="${event.key==='Home'?'waitlist':event.key==='End'?'students':kind==='waitlist'?'students':'waitlist'}"]`);next.click();next.focus();}});}
for(const id of ['search','student-filter','include-test'])$(id).addEventListener(id==='search'?'input':'change',render);
$('refresh').addEventListener('click',refresh);$('close-detail').addEventListener('click',()=>$('detail').close());$('detail').addEventListener('click',e=>{if(e.target===$('detail')){const r=$('detail').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('detail').close();}});
$('export').addEventListener('click',()=>{const blob=new Blob([toCSV(filtered(),kind)],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`mediqit-${kind}-${new Date().toISOString().slice(0,10)}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
fetch('/api/session',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(s=>{if(s){$('admin-identity').textContent=`${s.displayName} · ${s.role==='owner'?'Owner':'Private'} workspace`;$('workers-link').hidden=s.role!=='owner';}});
window.addEventListener('pageshow',event=>{if(event.persisted)refresh();});
window.addEventListener('pagehide',()=>{if($('detail').open)$('detail').close();$('detail-answers').replaceChildren();$('detail-title').textContent='Student response';$('detail-meta').textContent='';records={waitlist:[],students:[]};loaded=false;render();});
refresh();
