'use strict';

const APP_SCHEMA = 'ai-project-management-tool-v1';
const PROJECT_SCHEMA = 'project-management-tool-v1';
const LOCAL_KEY = 'ai_project_management_local_state_v1';
const PROJECT_CACHE_KEY = 'ai_project_management_project_cache_v1';
const LEGACY_CACHE_KEY = 'finanztracker_48h_cached_data_v1';
const LEGACY_TODO_KEY = 'finanztracker_48h_batch_todo_v1';
const LEGACY_TEST_KEY = 'finanztracker_48h_test_state_v1';
const LEGACY_NOTE_KEY = 'finanztracker_48h_batch_notes_v1';
const DB_NAME = 'finanztrackerTodoTool';
const DB_STORE = 'screenshots';

const LEGACY_TODO_KEYS = [
  'finanztracker_48h_todo_v2',
  'finanztracker_48h_todo_v3',
  'finanztracker_48h_batch_todo_v1'
];

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

const TEST_STATUSES = [
  ['untested','Noch nicht getestet'],
  ['passed','Bestanden'],
  ['failed','Fehlgeschlagen'],
  ['partial','Teilweise bestanden'],
  ['blocked','Blockiert'],
  ['not-testable','Nicht testbar'],
  ['irrelevant','Nicht mehr relevant'],
  ['replaced','Ersetzt']
];
const TEST_COMPLETE = new Set(['passed','not-testable','irrelevant','replaced']);
const DEVICE_OPTIONS = ['','iPhone','iPad','Desktop','Mac','Windows','Android','anderes'];
const BROWSER_OPTIONS = ['','Safari','PWA','Chrome','Edge','Firefox','anderes'];
const ENV_OPTIONS = ['','lokal','Vercel Preview','Production','Supabase Test','Supabase Live','anderes'];

const NAV_ITEMS = [
  ['dashboard','⌂','Dashboard'],
  ['scope','◈','Ziel & Scope'],
  ['phases','◫','Phasen'],
  ['batches','▦','Batches'],
  ['mikaTasks','◎','Mika-Aufgaben'],
  ['tests','✓','Tests / QA'],
  ['bugs','⚠','Bugs'],
  ['ideas','✦','Ideen'],
  ['questions','?','Offene Fragen'],
  ['decisions','◆','Entscheidungen'],
  ['aiBatches','AI','KI-Batches'],
  ['masterchat','M','Masterchat'],
  ['subchats','S','Subchats'],
  ['files','▤','Dateien & Backups'],
  ['github','GH','GitHub / PR'],
  ['timeline','↕','Timeline'],
  ['risks','!','Risiken'],
  ['notes','✎','Schnellnotizen'],
  ['data','⚙','Daten & Validierung']
];

let PROJECT_RAW = null;
let LEGACY_RAW = null;
let DATA = null;
let LOCAL = null;
let VALIDATION = { errors: [], warnings: [] };
let currentDialog = null;
let toastTimer = null;

const $ = selector => document.querySelector(selector);
const $$ = selector => Array.from(document.querySelectorAll(selector));
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
const nowIso = () => new Date().toISOString();
const today = () => new Date().toISOString().slice(0,10);
const compactDate = value => value ? new Intl.DateTimeFormat('de-DE',{dateStyle:'medium'}).format(new Date(value)) : '—';
const uniqueId = prefix => `${prefix}-${today().replaceAll('-','')}-${Math.random().toString(36).slice(2,8)}`;
const asArray = value => Array.isArray(value) ? value : [];
const asObject = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};

function parseJson(text, fallback = null) {
  try { return JSON.parse(text); } catch { return fallback; }
}
function readLocal(key, fallback = {}) {
  return parseJson(localStorage.getItem(key) || '', fallback);
}
function writeLocal(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
function showToast(message, tone = 'normal') {
  const toast = $('#toast');
  toast.textContent = message;
  toast.className = `toast${tone === 'danger' ? ' card-danger' : tone === 'success' ? ' card-success' : ''}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 4200);
}
function markSaved(label = 'Lokal gespeichert') {
  const el = $('#saveStatus');
  el.textContent = `${label} · ${new Date().toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})}`;
  el.className = 'badge badge-success';
}
function saveLocal({render = false, timeline = null} = {}) {
  LOCAL.updatedAt = nowIso();
  if (timeline) addTimeline(timeline, false);
  writeLocal(LOCAL_KEY, LOCAL);
  syncLegacyStorage();
  markSaved();
  if (render) renderApp();
}

function defaultLocalState() {
  return {
    schemaVersion: APP_SCHEMA,
    updatedAt: nowIso(),
    batchTaskState: {},
    mikaTasks: [],
    testResults: {},
    bugs: [],
    ideas: [],
    questions: [],
    decisions: [],
    quickNotes: [],
    entityOverrides: { bugs: {}, ideas: {}, questions: {}, decisions: {} },
    legacyGeneralNotes: '',
    unmappedLegacyItems: { todoState: {}, testState: {} },
    importHistory: [],
    importedProjectSnapshots: [],
    timeline: [],
    ui: { activeView: 'dashboard', search: '', showArchived: false }
  };
}

function normalizeLocalState(raw) {
  const base = defaultLocalState();
  const source = asObject(raw);
  return {
    ...base,
    ...source,
    batchTaskState: asObject(source.batchTaskState),
    mikaTasks: asArray(source.mikaTasks),
    testResults: asObject(source.testResults),
    bugs: asArray(source.bugs),
    ideas: asArray(source.ideas),
    questions: asArray(source.questions),
    decisions: asArray(source.decisions),
    quickNotes: asArray(source.quickNotes),
    entityOverrides: {
      bugs: asObject(source.entityOverrides?.bugs),
      ideas: asObject(source.entityOverrides?.ideas),
      questions: asObject(source.entityOverrides?.questions),
      decisions: asObject(source.entityOverrides?.decisions)
    },
    unmappedLegacyItems: {
      todoState: asObject(source.unmappedLegacyItems?.todoState),
      testState: asObject(source.unmappedLegacyItems?.testState)
    },
    importHistory: asArray(source.importHistory),
    importedProjectSnapshots: asArray(source.importedProjectSnapshots),
    timeline: asArray(source.timeline),
    ui: { ...base.ui, ...asObject(source.ui) }
  };
}

function migrateExistingBrowserState(localState) {
  const mergedTodos = {};
  for (const key of LEGACY_TODO_KEYS) {
    const state = readLocal(key, {});
    for (const [rawId, value] of Object.entries(asObject(state))) {
      const id = ID_ALIASES[rawId] || rawId;
      const done = value === true || value?.done === true;
      if (done) mergedTodos[id] = true;
    }
  }
  for (const [id, done] of Object.entries(mergedTodos)) {
    if (done && !localState.batchTaskState[id]) {
      localState.batchTaskState[id] = { status: 'done', updatedAt: nowIso(), source: 'legacy-localStorage' };
    }
  }

  const legacyTests = readLocal(LEGACY_TEST_KEY, {});
  for (const [id, result] of Object.entries(asObject(legacyTests))) {
    const existing = asObject(localState.testResults[id]);
    localState.testResults[id] = {
      status: existing.status || (result?.status || (result?.done ? 'passed' : 'untested')),
      device: existing.device || result?.device || '',
      browser: existing.browser || result?.browser || '',
      environment: existing.environment || result?.environment || '',
      actualResult: existing.actualResult || result?.actualResult || '',
      note: existing.note || result?.note || '',
      lastTestedAt: existing.lastTestedAt || result?.lastTestedAt || '',
      updatedAt: existing.updatedAt || nowIso()
    };
  }

  const notes = localStorage.getItem(LEGACY_NOTE_KEY) || '';
  if (!localState.legacyGeneralNotes && notes) localState.legacyGeneralNotes = notes;
  return localState;
}

function syncLegacyStorage() {
  const todoState = readLocal(LEGACY_TODO_KEY, {});
  for (const [id, value] of Object.entries(LOCAL.batchTaskState)) {
    todoState[id] = value?.status === 'done';
  }
  writeLocal(LEGACY_TODO_KEY, todoState);

  const testState = readLocal(LEGACY_TEST_KEY, {});
  for (const [id, result] of Object.entries(LOCAL.testResults)) {
    testState[id] = {
      ...asObject(testState[id]),
      done: result.status === 'passed',
      status: result.status || 'untested',
      note: result.note || '',
      device: result.device || '',
      browser: result.browser || '',
      environment: result.environment || '',
      actualResult: result.actualResult || '',
      lastTestedAt: result.lastTestedAt || ''
    };
  }
  writeLocal(LEGACY_TEST_KEY, testState);
  localStorage.setItem(LEGACY_NOTE_KEY, LOCAL.legacyGeneralNotes || '');
}

async function fetchJson(path, cacheKey) {
  try {
    const response = await fetch(`${path}?t=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    const data = await response.json();
    localStorage.setItem(cacheKey, JSON.stringify(data));
    return { data, source: 'network' };
  } catch (error) {
    const cached = parseJson(localStorage.getItem(cacheKey) || '', null);
    if (cached) return { data: cached, source: 'cache', warning: error.message };
    return { data: null, source: 'missing', warning: error.message };
  }
}

function groupBy(items, key) {
  return asArray(items).reduce((groups, item) => {
    const value = item[key] || 'Ohne Gruppe';
    (groups[value] ||= []).push(item);
    return groups;
  }, {});
}

function adaptLegacyData(legacy) {
  if (!legacy || !Array.isArray(legacy.todos) || !Array.isArray(legacy.tests)) return { batches: [], tests: [] };
  const batches = Object.entries(groupBy(legacy.todos, 'batch')).map(([batchId, tasks]) => ({
    id: batchId,
    title: tasks[0]?.batchTitle || batchId,
    description: 'Historischer Batch aus todo-data.json. IDs und lokale Zustände bleiben unverändert.',
    status: 'Archiviert',
    priority: 'P1',
    phaseId: 'phase-finanztracker-stabilization',
    time: tasks[0]?.time || '',
    source: 'legacy-todo-data',
    tasks: tasks.map(task => ({ id: task.id, title: task.text, tag: task.tag, legacy: true }))
  }));
  const taskToBatch = {};
  for (const batch of batches) for (const task of batch.tasks) taskToBatch[task.id] = batch.id;
  const tests = legacy.tests.map(test => ({
    id: test.id,
    suite: test.suite,
    suiteTitle: test.suiteTitle,
    title: test.title,
    description: '',
    relatedTaskIds: asArray(test.relatedTodos),
    relatedBatchIds: [...new Set(asArray(test.relatedTodos).map(id => taskToBatch[id]).filter(Boolean))],
    when: test.when || '',
    steps: asArray(test.steps),
    expected: asArray(test.expected),
    source: 'legacy-todo-data'
  }));
  return { batches, tests };
}

function mergeById(primary, secondary) {
  const map = new Map();
  for (const item of [...asArray(primary), ...asArray(secondary)]) {
    if (!item?.id) continue;
    if (!map.has(item.id)) map.set(item.id, item);
  }
  return [...map.values()];
}

function normalizeProjectData(projectRaw, legacyRaw) {
  const legacy = adaptLegacyData(legacyRaw);
  const project = asObject(projectRaw);
  return {
    schemaVersion: project.schemaVersion || PROJECT_SCHEMA,
    updatedAt: project.updatedAt || legacyRaw?.updatedAt || today(),
    project: asObject(project.project),
    phases: asArray(project.phases),
    batches: mergeById(project.batches, legacy.batches),
    mikaTasks: asArray(project.mikaTasks),
    tests: mergeById(project.tests, legacy.tests),
    bugs: asArray(project.bugs),
    ideas: asArray(project.ideas),
    questions: asArray(project.questions),
    decisions: asArray(project.decisions),
    timeline: asArray(project.timeline),
    masterchat: asObject(project.masterchat),
    subchats: asArray(project.subchats),
    aiBatches: asArray(project.aiBatches),
    files: asArray(project.files),
    backups: asArray(project.backups),
    github: asObject(project.github),
    risks: asArray(project.risks),
    notes: asArray(project.notes),
    sourceInfo: {
      projectData: projectRaw ? 'project-data.json' : 'nicht verfügbar',
      legacyData: legacyRaw ? 'todo-data.json' : 'nicht verfügbar'
    }
  };
}

function validateProject(raw, normalized) {
  const errors = [];
  const warnings = [];
  if (!raw || typeof raw !== 'object') errors.push('project-data.json fehlt oder ist kein JSON-Objekt.');
  if (raw && raw.schemaVersion !== PROJECT_SCHEMA) warnings.push(`Unbekannte schemaVersion: ${raw.schemaVersion || 'fehlt'}.`);
  const requiredArrays = ['phases','batches','mikaTasks','tests','bugs','ideas','questions','decisions','timeline','subchats','aiBatches','files','backups','risks','notes'];
  for (const key of requiredArrays) if (raw && !Array.isArray(raw[key])) errors.push(`Top-Level-Feld ${key} muss ein Array sein.`);
  if (raw && (!raw.project || typeof raw.project !== 'object')) errors.push('Top-Level-Feld project muss ein Objekt sein.');

  const collections = ['phases','batches','mikaTasks','tests','bugs','ideas','questions','decisions','timeline','subchats','aiBatches','files','backups','risks','notes'];
  for (const key of collections) {
    const seen = new Set();
    for (const item of asArray(normalized[key])) {
      if (!item.id) { warnings.push(`${key}: Ein Eintrag hat keine ID.`); continue; }
      if (seen.has(item.id)) errors.push(`${key}: doppelte ID ${item.id}.`);
      seen.add(item.id);
    }
  }

  const phaseIds = new Set(normalized.phases.map(item => item.id));
  const taskIds = new Set();
  for (const batch of normalized.batches) {
    for (const task of asArray(batch.tasks)) {
      if (!task.id) { warnings.push(`Batch ${batch.id}: Task ohne ID.`); continue; }
      if (taskIds.has(task.id)) errors.push(`Batch-Tasks: doppelte ID ${task.id}.`);
      taskIds.add(task.id);
    }
  }
  const batchIds = new Set(normalized.batches.map(item => item.id));
  for (const batch of normalized.batches) if (batch.phaseId && !phaseIds.has(batch.phaseId)) warnings.push(`Batch ${batch.id} verweist auf unbekannte Phase ${batch.phaseId}.`);
  for (const test of normalized.tests) {
    for (const id of asArray(test.relatedTaskIds)) if (!taskIds.has(id)) warnings.push(`Test ${test.id} verweist auf unbekannte Task-ID ${id}.`);
    for (const id of asArray(test.relatedBatchIds)) if (!batchIds.has(id)) warnings.push(`Test ${test.id} verweist auf unbekannte Batch-ID ${id}.`);
  }

  const knownStatuses = {
    phases: new Set(['In Planung','Geplant','In Bearbeitung','Testing','Review nötig','Done','Abgeschlossen','Pausiert','Archiviert']),
    batches: new Set(['In Planung','Geplant','Bereit für Codex/Claude','In Bearbeitung','PR offen','Review nötig','Testing','Nachbesserung nötig','Done','Archiviert','Ersetzt']),
    questions: new Set(['offen','in-review','answered','blocked','archived']),
    decisions: new Set(['aktiv','superseded','review','archived']),
    bugs: new Set(['offen','in-progress','testing','blocked','behoben','archived'])
  };
  for (const [collection, allowed] of Object.entries(knownStatuses)) {
    for (const item of asArray(normalized[collection])) {
      if (item.status && !allowed.has(item.status)) warnings.push(`${collection} ${item.id}: unbekannter Status ${item.status}.`);
    }
  }

  for (const key of collections) {
    for (const item of asArray(normalized[key])) {
      for (const [field,value] of Object.entries(item)) {
        if ((/date$/i.test(field) || /At$/.test(field)) && value !== null && value !== undefined && typeof value !== 'string') warnings.push(`${key} ${item.id || 'ohne ID'}: ${field} muss ein String oder null sein.`);
      }
    }
  }
  return { errors: [...new Set(errors)], warnings: [...new Set(warnings)] };
}

function allTaskIds() {
  return new Set(DATA.batches.flatMap(batch => asArray(batch.tasks).map(task => task.id)));
}
function allTestIds() {
  return new Set(DATA.tests.map(test => test.id));
}
function refreshUnmappedLegacy() {
  const tasks = allTaskIds();
  const tests = allTestIds();
  LOCAL.unmappedLegacyItems.todoState = {};
  LOCAL.unmappedLegacyItems.testState = {};
  for (const [id, value] of Object.entries(LOCAL.batchTaskState)) if (!tasks.has(id)) LOCAL.unmappedLegacyItems.todoState[id] = value;
  for (const [id, value] of Object.entries(LOCAL.testResults)) if (!tests.has(id)) LOCAL.unmappedLegacyItems.testState[id] = value;
}

function taskDone(id) {
  return LOCAL.batchTaskState[id]?.status === 'done';
}
function testResult(id) {
  return {
    status: 'untested', device: '', browser: '', environment: '', actualResult: '', note: '', lastTestedAt: '',
    ...asObject(LOCAL.testResults[id])
  };
}
function getOverride(collection, id) {
  return asObject(LOCAL.entityOverrides?.[collection]?.[id]);
}
function withOverride(collection, item) {
  return { ...item, ...getOverride(collection, item.id) };
}
function combinedCollection(key) {
  const staticItems = asArray(DATA[key]);
  const localItems = asArray(LOCAL[key]);
  return mergeById(localItems, staticItems).map(item => withOverride(key, item));
}
function matchesSearch(...values) {
  const query = (LOCAL.ui.search || '').trim().toLocaleLowerCase('de');
  if (!query) return true;
  return values.flat(Infinity).filter(Boolean).some(value => String(value).toLocaleLowerCase('de').includes(query));
}
function statusBadge(value) {
  const text = value || 'offen';
  const lower = String(text).toLowerCase();
  let cls = 'badge';
  if (/(done|bestanden|abgeschlossen|aktiv|behandelt)/.test(lower)) cls += ' badge-success';
  else if (/(kritisch|fehl|offen|hoch)/.test(lower)) cls += ' badge-danger';
  else if (/(planung|geplant|block|mittel|review|testing|teilweise)/.test(lower)) cls += ' badge-warning';
  else cls += ' badge-blue';
  return `<span class="${cls}">${esc(text)}</span>`;
}
function priorityBadge(value) {
  return value ? `<span class="badge ${value === 'P0' ? 'badge-danger' : value === 'P1' ? 'badge-warning' : 'badge-blue'}">${esc(value)}</span>` : '';
}
function selectOptions(options, selected) {
  return options.map(option => {
    const [value,label] = Array.isArray(option) ? option : [option,option || '—'];
    return `<option value="${esc(value)}" ${value === selected ? 'selected' : ''}>${esc(label)}</option>`;
  }).join('');
}

function addTimeline(entry, persist = true) {
  LOCAL.timeline.unshift({ id: uniqueId('local-event'), date: nowIso(), type: 'Lokale Änderung', ...entry });
  LOCAL.timeline = LOCAL.timeline.slice(0,200);
  if (persist) saveLocal();
}

function navigationCount(view) {
  if (!DATA || !LOCAL) return '';
  if (view === 'mikaTasks') return combinedMikaTasks().filter(item => item.status !== 'done' && item.status !== 'archived').length || '';
  if (view === 'tests') return DATA.tests.filter(test => !TEST_COMPLETE.has(testResult(test.id).status)).length || '';
  if (view === 'bugs') return combinedCollection('bugs').filter(item => !['done','closed','archived','behoben'].includes(String(item.status).toLowerCase())).length || '';
  if (view === 'questions') return combinedCollection('questions').filter(item => String(item.status).toLowerCase() === 'offen').length || '';
  if (view === 'risks') return DATA.risks.filter(item => ['offen','kritisch'].includes(String(item.status).toLowerCase()) || String(item.severity).toLowerCase() === 'kritisch').length || '';
  return '';
}

function renderNavigation() {
  const active = LOCAL.ui.activeView;
  const markup = NAV_ITEMS.map(([id,icon,label]) => `<button type="button" data-nav-view="${id}" class="${active === id ? 'active' : ''}"><span class="nav-icon">${esc(icon)}</span><span>${esc(label)}</span>${navigationCount(id) ? `<span class="nav-count">${navigationCount(id)}</span>` : ''}</button>`).join('');
  $('#desktopNav').innerHTML = markup;
  $('#mobileNav').innerHTML = markup;
  $$('.mobile-bottom-nav [data-view]').forEach(button => button.classList.toggle('active', button.dataset.view === active));
  $('#moreButton').classList.toggle('active', !['dashboard','batches','tests','mikaTasks'].includes(active));
  $$('[data-nav-view]').forEach(button => button.addEventListener('click', () => navigate(button.dataset.navView)));
}

function navigate(view) {
  if (!NAV_ITEMS.some(item => item[0] === view)) view = 'dashboard';
  LOCAL.ui.activeView = view;
  saveLocal();
  closeDrawer();
  renderApp();
  $('#mainContent').focus({preventScroll:true});
  window.scrollTo({top:0,behavior:'smooth'});
}
