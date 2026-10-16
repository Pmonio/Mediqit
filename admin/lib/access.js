export const dashboards=[
 {id:'overview',label:'Overview',description:'Business summary, alerts and assigned work'},
 {id:'marketing',label:'Marketing',description:'Campaign plans, channels, budgets and results'},
 {id:'research',label:'Customer Research',description:'Launch-list and student questionnaire responses'},
 {id:'content',label:'Content',description:'Content ideas, drafts, approvals and publishing'},
 {id:'roadmap',label:'Roadmap & Ideas',description:'Ideas, experiments, milestones and ownership'},
 {id:'finance',label:'Finance',description:'Budgets, expenses, funding and cash position'}
];
export const dashboardIds=dashboards.map(x=>x.id);
export function cleanPermissions(value){return [...new Set(Array.isArray(value)?value.filter(x=>dashboardIds.includes(x)):[])]}
export function canAccess(session,module){return session?.role==='owner'||cleanPermissions(session?.permissions).includes(module)}
export function firstDashboardPath(session){if(session?.role==='owner'||canAccess(session,'overview'))return'/overview';const first=dashboardIds.find(id=>canAccess(session,id));return first==='research'?'/responses':first?'/'+first:'/no-access'}
