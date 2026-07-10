'use strict';

const WORKSPACE_SCHEMA = 'mika-ai-project-management-tool-v1.1';
const BACKUP_SCHEMA = 'mika-ai-project-management-backup-v1.1';
const V1_APP_SCHEMA = 'ai-project-management-tool-v1';
const V1_PROJECT_SCHEMA = 'project-management-tool-v1';
const WORKSPACE_LOCAL_KEY = 'mika_ai_project_management_workspace_state_v1_1';
const V1_LOCAL_KEY = 'ai_project_management_local_state_v1';
const WORKSPACE_CACHE_KEY = 'mika_ai_project_management_workspace_cache_v1_1';
const LEGACY_CACHE_KEY = 'finanztracker_48h_cached_data_v1';
const LEGACY_TODO_KEY = 'finanztracker_48h_batch_todo_v1';
const LEGACY_TEST_KEY = 'finanztracker_48h_test_state_v1';
const LEGACY_NOTE_KEY = 'finanztracker_48h_batch_notes_v1';
const DB_NAME = 'finanztrackerTodoTool';
const DB_STORE = 'screenshots';
const FINANCE_PROJECT_ID = 'project-finanztracker';

const LEGACY_TODO_KEYS = ['finanztracker_48h_todo_v2','finanztracker_48h_todo_v3',LEGACY_TODO_KEY];
const ID_ALIASES = {
  'b0-01':'stand-001','b0-02':'stand-002','b0-03':'stand-003','b0-04':'stand-004',
  'b1-01':'auth-001','b1-02':'auth-002','b1-03':'auth-003','b1-04':'auth-004',
  'b2-01':'nav-001','b2-02':'nav-002','b2-03':'nav-003','b2-04':'nav-004','b2-05':'nav-005',
  'b3-01':'qe-001','b3-02':'qe-002','b3-03':'qe-003','b3-04':'qe-004','b3-05':'qe-005',
  'b4-01':'theme-001','b4-02':'theme-002','b4-03':'theme-003','b4-04':'theme-004','b4-05':'theme-005',
  'b5-01':'data-001','b5-02':'data-002','b5-03':'data-003','b5-04':'data-004','b5-05':'data-005',
  'b6-01':'copy-001','b6-02':'copy-002','b6-03':'copy-003','b6-04':'copy-004','b6-05':'copy-005',
  'b7-01':'test-001','b7-02':'test-002','b7-03':'test-003','b7-04':'test-004','b7-05':'test-005'
};
const TEST_STATUSES = [['untested','Noch nicht getestet'],['passed','Bestanden'],['failed','Fehlgeschlagen'],['partial','Teilweise bestanden'],['blocked','Blockiert'],['not-testable','Nicht testbar'],['irrelevant','Nicht mehr relevant'],['replaced','Ersetzt']];
const TEST_COMPLETE = new Set(['passed','not-testable','irrelevant','replaced']);
const DEVICE_OPTIONS = ['','iPhone','iPad','Desktop','Mac','Windows','Android','anderes'];
const BROWSER_OPTIONS = ['','Safari','PWA','Chrome','Edge','Firefox','anderes'];
const ENV_OPTIONS = ['','lokal','Vercel Preview','Production','Supabase Test','Supabase Live','anderes'];
const PROJECT_NAV_GROUPS = [
  {id:'steering',label:'Steuerung',icon:'◈',items:[['dashboard','⌂','Überblick'],['workflow','⇢','Phasen & Gates'],['knowledge','◆','Entscheidungen & Wissen']]},
  {id:'delivery',label:'Umsetzung',icon:'▦',items:[['work','▦','Batches & Aufgaben'],['files','▤','Dateien & Backups']]},
  {id:'quality',label:'Qualität',icon:'✓',items:[['quality','✓','Tests, Bugs & Risiken']]},
  {id:'ai',label:'KI & Chats',icon:'AI',items:[['ai','AI','Modelle & Chats'],['data','⚙','Daten & lokale Notizen']]}
];
const PRIMARY_PROJECT_VIEWS = ['dashboard','work','quality','ai'];

let RAW_WORKSPACE=null, LEGACY_RAW=null, WORKSPACE=null, WORKSPACE_LOCAL=null, ACTIVE_PROJECT_ID=null, DATA=null, LOCAL=null;
let VALIDATION={errors:[],warnings:[]}, currentDialog=null, toastTimer=null;
const $=selector=>document.querySelector(selector);
const $$=selector=>Array.from(document.querySelectorAll(selector));
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
const asArray=value=>Array.isArray(value)?value:[];
const asObject=value=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};
const nowIso=()=>new Date().toISOString();
const today=()=>nowIso().slice(0,10);
const uniqueId=prefix=>`${prefix}-${today().replaceAll('-','')}-${Math.random().toString(36).slice(2,8)}`;
const compactDate=value=>{if(!value)return '—';const date=new Date(value);return Number.isNaN(date.getTime())?String(value):new Intl.DateTimeFormat('de-DE',{dateStyle:'medium'}).format(date)};
const parseJson=(text,fallback=null)=>{try{return JSON.parse(text)}catch{return fallback}};
const readLocal=(key,fallback={})=>parseJson(localStorage.getItem(key)||'',fallback);
const writeLocal=(key,value)=>localStorage.setItem(key,JSON.stringify(value));

function showToast(message,tone='normal'){const toast=$('#toast');if(!toast)return;toast.textContent=message;toast.className=`toast${tone==='danger'?' toast-danger':tone==='success'?' toast-success':''}`;clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.add('hidden'),4600)}
function markSaved(label='Lokal gespeichert'){const element=$('#saveStatus');if(!element)return;element.textContent=`${label} · ${new Date().toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})}`;element.className='badge badge-success'}
function baseProjectLocalState(){return{schemaVersion:V1_APP_SCHEMA,updatedAt:nowIso(),batchTaskState:{},mikaTasks:[],testResults:{},bugs:[],ideas:[],questions:[],decisions:[],quickNotes:[],backups:[],chatOverrides:{},gateOverrides:{},entityOverrides:{bugs:{},ideas:{},questions:{},decisions:{}},legacyGeneralNotes:'',unmappedLegacyItems:{todoState:{},testState:{}},importHistory:[],importedProjectSnapshots:[],timeline:[],ui:{activeView:'dashboard',search:'',showArchived:false,timelineType:'all'}}}
function defaultWorkspaceLocalState(){return{schemaVersion:BACKUP_SCHEMA,updatedAt:nowIso(),ui:{activeProjectId:null,projectViews:{},searches:{},expandedNavGroups:{},projectFilter:'all'},projectStates:{},importedProjects:[],globalNotes:[],importHistory:[],conflictCopies:[]}}
function normalizeProjectLocalState(raw){const base=baseProjectLocalState(),source=asObject(raw);return{...base,...source,batchTaskState:asObject(source.batchTaskState),mikaTasks:asArray(source.mikaTasks),testResults:asObject(source.testResults),bugs:asArray(source.bugs),ideas:asArray(source.ideas),questions:asArray(source.questions),decisions:asArray(source.decisions),quickNotes:asArray(source.quickNotes),backups:asArray(source.backups),chatOverrides:asObject(source.chatOverrides),gateOverrides:asObject(source.gateOverrides),entityOverrides:{bugs:asObject(source.entityOverrides?.bugs),ideas:asObject(source.entityOverrides?.ideas),questions:asObject(source.entityOverrides?.questions),decisions:asObject(source.entityOverrides?.decisions)},unmappedLegacyItems:{todoState:asObject(source.unmappedLegacyItems?.todoState),testState:asObject(source.unmappedLegacyItems?.testState)},importHistory:asArray(source.importHistory),importedProjectSnapshots:asArray(source.importedProjectSnapshots),timeline:asArray(source.timeline),ui:{...base.ui,...asObject(source.ui)}}}
function normalizeWorkspaceLocalState(raw){const base=defaultWorkspaceLocalState(),source=asObject(raw),projectStates={};for(const[projectId,state]of Object.entries(asObject(source.projectStates)))projectStates[projectId]=normalizeProjectLocalState(state);return{...base,...source,ui:{...base.ui,...asObject(source.ui),projectViews:asObject(source.ui?.projectViews),searches:asObject(source.ui?.searches),expandedNavGroups:asObject(source.ui?.expandedNavGroups)},projectStates,importedProjects:asArray(source.importedProjects),globalNotes:asArray(source.globalNotes),importHistory:asArray(source.importHistory),conflictCopies:asArray(source.conflictCopies)}}
function ensureProjectLocal(projectId){if(!WORKSPACE_LOCAL.projectStates[projectId])WORKSPACE_LOCAL.projectStates[projectId]=baseProjectLocalState();WORKSPACE_LOCAL.projectStates[projectId]=normalizeProjectLocalState(WORKSPACE_LOCAL.projectStates[projectId]);return WORKSPACE_LOCAL.projectStates[projectId]}
function migrateExistingLegacyBrowserState(projectState){const mergedTodos={};for(const key of LEGACY_TODO_KEYS){for(const[rawId,value]of Object.entries(asObject(readLocal(key,{})))){const id=ID_ALIASES[rawId]||rawId;if(value===true||value?.done===true)mergedTodos[id]=true}}for(const id of Object.keys(mergedTodos)){if(projectState.batchTaskState[id]?.status!=='done')projectState.batchTaskState[id]={status:'done',updatedAt:nowIso(),source:'legacy-localStorage'}}for(const[id,result]of Object.entries(asObject(readLocal(LEGACY_TEST_KEY,{})))){const existing=asObject(projectState.testResults[id]);projectState.testResults[id]={status:existing.status||result?.status||(result?.done?'passed':'untested'),device:existing.device||result?.device||'',browser:existing.browser||result?.browser||'',environment:existing.environment||result?.environment||'',actualResult:existing.actualResult||result?.actualResult||'',note:existing.note||result?.note||'',lastTestedAt:existing.lastTestedAt||result?.lastTestedAt||'',updatedAt:existing.updatedAt||nowIso()}}const notes=localStorage.getItem(LEGACY_NOTE_KEY)||'';if(!projectState.legacyGeneralNotes&&notes)projectState.legacyGeneralNotes=notes;return projectState}
