function updateTestResult(id, field, value) {
  const current = testResult(id);
  current[field] = value;
  current.updatedAt = nowIso();
  if (field === 'status' && value !== 'untested') current.lastTestedAt = nowIso();
  LOCAL.testResults[id] = current;
  saveLocal({render: field === 'status', timeline: field === 'status' ? {title:`Test ${id}: ${value}`,description:'Strukturierter Teststatus aktualisiert.',type:'Test'} : null});
}

function saveQuickNote(text, type) {
  const clean = String(text || '').trim();
  if (!clean) return showToast('Bitte zuerst eine Notiz eingeben.','danger');
  if (type === 'task') {
    LOCAL.mikaTasks.unshift({id:uniqueId('mika-task'),title:clean,description:'Aus Schnellnotiz erstellt.',category:'Schnellnotiz',priority:'P2',status:'open',createdAt:nowIso(),updatedAt:nowIso()});
  } else if (type === 'idea') {
    LOCAL.ideas.unshift({id:uniqueId('idea-local'),title:clean,description:'Aus Schnellnotiz erstellt.',priority:'P2',status:'neu',createdAt:nowIso()});
  } else if (type === 'question') {
    LOCAL.questions.unshift({id:uniqueId('question-local'),title:clean,priority:'P2',status:'offen',answerOwner:'Mika',impact:'Aus Schnellnotiz erstellt.',createdAt:nowIso()});
  } else {
    LOCAL.quickNotes.unshift({id:uniqueId('note-local'),text:clean,type:'note',createdAt:nowIso(),archived:false});
  }
  addTimeline({title:'Schnellnotiz gespeichert',description:clean,type:type},false);
  saveLocal({render:true});
  showToast('Schnellnotiz lokal gespeichert.','success');
}

function openEntryDialog(type, context = {}) {
  const definitions = {
    mikaTask: {
      title:'Mika-Aufgabe anlegen', eyebrow:'Persönliche Aufgabe · nur lokal', fields:[
        ['title','Titel','text',true,context.title||''],['description','Beschreibung','textarea',false,context.description||''],['category','Kategorie','text',false,'Allgemein'],['priority','Priorität','select',false,'P2',[['P0','P0 kritisch'],['P1','P1 wichtig'],['P2','P2 normal'],['P3','P3 später']]],['dueDate','Fälligkeitsdatum','date',false,''],['projectRef','Projektbezug','text',false,'']
      ]
    },
    bug: {
      title:'Bug anlegen', eyebrow:'Fehler · nur lokal', fields:[
        ['title','Titel','text',true,context.testId?`Fehler aus Test ${context.testId}`:''],['description','Beschreibung / Repro','textarea',true,''],['severity','Schweregrad','select',false,'mittel',[['kritisch','Kritisch'],['hoch','Hoch'],['mittel','Mittel'],['niedrig','Niedrig']]],['status','Status','select',false,'offen',[['offen','Offen'],['in-progress','In Bearbeitung'],['blocked','Blockiert']]],['relatedTestId','Verknüpfter Test','text',false,context.testId||''],['expected','Erwartet','textarea',false,''],['actual','Tatsächlich','textarea',false,'']
      ]
    },
    question: {
      title:'Offene Frage anlegen', eyebrow:'Frage · nur lokal', fields:[
        ['title','Frage','textarea',true,''],['priority','Priorität','select',false,'P1',[['P0','P0 kritisch'],['P1','P1 wichtig'],['P2','P2 normal'],['P3','P3 später']]],['answerOwner','Wer muss antworten?','text',false,'Mika'],['impact','Auswirkung / warum wichtig','textarea',false,'']
      ]
    },
    decision: {
      title:'Entscheidung dokumentieren', eyebrow:'Entscheidungslog · nur lokal', fields:[
        ['title','Titel','text',true,''],['reason','Grund','textarea',true,''],['alternatives','Geprüfte Alternativen (eine pro Zeile)','textarea',false,''],['decision','Finale Entscheidung','textarea',true,''],['impact','Auswirkungen','textarea',false,'']
      ]
    },
    idea: {
      title:'Idee erfassen', eyebrow:'Noch keine Aufgabe · nur lokal', fields:[
        ['title','Titel','text',true,''],['description','Beschreibung','textarea',false,''],['priority','Priorität','select',false,'P2',[['P1','P1 wichtig'],['P2','P2 normal'],['P3','P3 später'],['Idee','Idee']]]
      ]
    }
  };
  const def = definitions[type];
  if (!def) return;
  currentDialog = {type, context};
  $('#dialogEyebrow').textContent = def.eyebrow;
  $('#dialogTitle').textContent = def.title;
  $('#dialogFields').innerHTML = def.fields.map(([name,label,kind,required,value,options]) => {
    const attrs = `name="${esc(name)}" ${required?'required':''}`;
    let input;
    if (kind === 'textarea') input = `<textarea ${attrs}>${esc(value)}</textarea>`;
    else if (kind === 'select') input = `<select ${attrs}>${selectOptions(options,value)}</select>`;
    else input = `<input type="${kind}" ${attrs} value="${esc(value)}">`;
    return `<label class="${kind==='textarea'?'full':''}"><span class="field-label">${esc(label)}${required?' *':''}</span>${input}</label>`;
  }).join('');
  $('#entryDialog').showModal();
}

function handleDialogSubmit(event) {
  event.preventDefault();
  if (event.submitter?.value === 'cancel') { $('#entryDialog').close(); return; }
  if (!currentDialog) return;
  const form = new FormData(event.currentTarget);
  const values = Object.fromEntries(form.entries());
  const createdAt = nowIso();
  if (currentDialog.type === 'mikaTask') {
    LOCAL.mikaTasks.unshift({id:uniqueId('mika-task'),...values,status:'open',createdAt,updatedAt:createdAt});
  } else if (currentDialog.type === 'bug') {
    LOCAL.bugs.unshift({id:uniqueId('bug-local'),...values,relatedTestIds:values.relatedTestId?[values.relatedTestId]:[],relatedBatchIds:[],createdAt});
  } else if (currentDialog.type === 'question') {
    LOCAL.questions.unshift({id:uniqueId('question-local'),...values,status:'offen',createdAt});
  } else if (currentDialog.type === 'decision') {
    LOCAL.decisions.unshift({id:uniqueId('decision-local'),...values,alternatives:String(values.alternatives||'').split('\n').map(x=>x.trim()).filter(Boolean),date:today(),status:'aktiv',createdAt});
  } else if (currentDialog.type === 'idea') {
    LOCAL.ideas.unshift({id:uniqueId('idea-local'),...values,status:'neu',createdAt});
  }
  addTimeline({title:`${currentDialog.type} lokal angelegt`,description:values.title || '',type:'Lokaler Eintrag'},false);
  saveLocal({render:true});
  $('#entryDialog').close();
  showToast('Eintrag lokal gespeichert.','success');
}

function openDB() {
  return new Promise((resolve,reject) => {
    const request = indexedDB.open(DB_NAME,1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(DB_STORE)) request.result.createObjectStore(DB_STORE,{keyPath:'id'});
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function dbAll() {
  const db = await openDB();
  return new Promise((resolve,reject) => {
    const tx = db.transaction(DB_STORE,'readonly');
    const request = tx.objectStore(DB_STORE).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}
async function dbPut(item) {
  const db = await openDB();
  return new Promise((resolve,reject) => {
    const tx = db.transaction(DB_STORE,'readwrite');
    const request = tx.objectStore(DB_STORE).put(item);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
async function dbDelete(id) {
  const db = await openDB();
  return new Promise((resolve,reject) => {
    const tx = db.transaction(DB_STORE,'readwrite');
    const request = tx.objectStore(DB_STORE).delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
async function handleScreenshotInput(event) {
  const testId = event.target.dataset.screenshotInput;
  for (const file of event.target.files) {
    if (!file.type.startsWith('image/')) continue;
    const dataUrl = await new Promise((resolve,reject)=>{
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    await dbPut({id:`${testId}-${Date.now()}-${Math.random().toString(36).slice(2)}`,testId,name:file.name,type:file.type,size:file.size,createdAt:nowIso(),dataUrl});
  }
  event.target.value = '';
  addTimeline({title:`Screenshot zu Test ${testId} angehängt`,description:'Lokaler Anhang wurde in IndexedDB gespeichert.',type:'Test'},false);
  saveLocal();
  renderAllScreenshotGrids();
  showToast('Screenshot lokal gespeichert.','success');
}
async function renderAllScreenshotGrids() {
  let screenshots = [];
  try { screenshots = await dbAll(); } catch { return; }
  $$('[data-screenshot-grid]').forEach(grid => {
    const testId = grid.dataset.screenshotGrid;
    const items = screenshots.filter(item => item.testId === testId);
    grid.innerHTML = items.map(item => `<div class="screenshot"><img src="${item.dataUrl}" alt="Lokaler Testscreenshot"><div class="screenshot-name">${esc(item.name)}</div><button class="button button-small button-ghost" data-delete-shot="${esc(item.id)}">Entfernen</button></div>`).join('');
  });
  $$('[data-delete-shot]').forEach(button => button.addEventListener('click',async()=>{if(!confirm('Diesen lokalen Screenshot entfernen?'))return;await dbDelete(button.dataset.deleteShot);renderAllScreenshotGrids();}));
}
async function mergeScreenshots(imported) {
  const existing = await dbAll();
  const ids = new Set(existing.map(item=>item.id));
  let added = 0;
  for (const raw of asArray(imported)) {
    if (!raw || !raw.dataUrl) continue;
    const item = {...raw};
    if (!item.id || ids.has(item.id)) item.id = `${item.testId || 'legacy'}-import-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    ids.add(item.id);
    await dbPut(item);
    added++;
  }
  return added;
}

function exportLegacyTodoState() {
  const state = readLocal(LEGACY_TODO_KEY, {});
  for (const [id,value] of Object.entries(LOCAL.batchTaskState)) state[id] = value?.status === 'done';
  return state;
}
function exportLegacyTestState() {
  const state = readLocal(LEGACY_TEST_KEY, {});
  for (const [id,result] of Object.entries(LOCAL.testResults)) state[id] = {...asObject(state[id]),done:result.status==='passed',...result};
  return state;
}
async function exportBackup() {
  try {
    refreshUnmappedLegacy();
    saveLocal();
    const screenshots = await dbAll();
    const payload = {
      schema: APP_SCHEMA,
      exportedAt: nowIso(),
      projectId: DATA.project.id,
      projectDataVersion: DATA.updatedAt,
      localState: LOCAL,
      projectDataSnapshot: PROJECT_RAW,
      todoState: exportLegacyTodoState(),
      testState: exportLegacyTestState(),
      generalNotes: LOCAL.legacyGeneralNotes || '',
      screenshots
    };
    downloadJson(payload,`${DATA.project.id || 'project'}-project-management-backup-${today()}.json`);
    addTimeline({title:'Lokales Projektbackup exportiert',description:`${screenshots.length} Screenshots eingeschlossen.`,type:'Backup'},false);
    saveLocal();
    showToast('Backup exportiert. Datei sicher aufbewahren.','success');
  } catch (error) {
    showToast(`Backup fehlgeschlagen: ${error.message}`,'danger');
  }
}
function downloadJson(payload, fileName) {
  const blob = new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  setTimeout(()=>URL.revokeObjectURL(link.href),1000);
}

function mergeText(existing, imported, label = 'Import') {
  const a = String(existing || '').trim();
  const b = String(imported || '').trim();
  if (!b || a === b) return a;
  if (!a) return b;
  return `${a}\n\n--- ${label} ${new Date().toLocaleString('de-DE')} ---\n${b}`;
}
function mergeArrayPreservingConflicts(existing, imported, prefix) {
  const result = [...asArray(existing)];
  const byId = new Map(result.map(item=>[item.id,item]));
  for (const item of asArray(imported)) {
    if (!item?.id) { result.push({...item,id:uniqueId(prefix)}); continue; }
    const found = byId.get(item.id);
    if (!found) { result.push(item); byId.set(item.id,item); }
    else if (JSON.stringify(found) !== JSON.stringify(item)) result.push({...item,id:`${item.id}-import-${Math.random().toString(36).slice(2,7)}`,importedFromId:item.id});
  }
  return result;
}
function mergeTestResults(existing, imported) {
  const result = {...asObject(existing)};
  for (const [id,raw] of Object.entries(asObject(imported))) {
    const incoming = asObject(raw);
    if (!result[id]) { result[id] = incoming; continue; }
    const current = asObject(result[id]);
    result[id] = {
      ...incoming,
      ...current,
      status: current.status && current.status !== 'untested' ? current.status : incoming.status || (incoming.done?'passed':'untested'),
      note: mergeText(current.note,incoming.note,'importierte Testnotiz'),
      actualResult: mergeText(current.actualResult,incoming.actualResult,'importiertes Ergebnis'),
      updatedAt: nowIso()
    };
  }
  return result;
}
function mergeLocalStates(existingRaw, importedRaw) {
  const existing = normalizeLocalState(existingRaw);
  const incoming = normalizeLocalState(importedRaw);
  const taskState = {...incoming.batchTaskState,...existing.batchTaskState};
  for (const id of new Set([...Object.keys(incoming.batchTaskState),...Object.keys(existing.batchTaskState)])) {
    if (incoming.batchTaskState[id]?.status === 'done' || existing.batchTaskState[id]?.status === 'done') taskState[id] = {...incoming.batchTaskState[id],...existing.batchTaskState[id],status:'done'};
  }
  return normalizeLocalState({
    ...incoming,
    ...existing,
    batchTaskState: taskState,
    testResults: mergeTestResults(existing.testResults,incoming.testResults),
    mikaTasks: mergeArrayPreservingConflicts(existing.mikaTasks,incoming.mikaTasks,'mika-task'),
    bugs: mergeArrayPreservingConflicts(existing.bugs,incoming.bugs,'bug-local'),
    ideas: mergeArrayPreservingConflicts(existing.ideas,incoming.ideas,'idea-local'),
    questions: mergeArrayPreservingConflicts(existing.questions,incoming.questions,'question-local'),
    decisions: mergeArrayPreservingConflicts(existing.decisions,incoming.decisions,'decision-local'),
    quickNotes: mergeArrayPreservingConflicts(existing.quickNotes,incoming.quickNotes,'note-local'),
    timeline: mergeArrayPreservingConflicts(existing.timeline,incoming.timeline,'local-event'),
    legacyGeneralNotes: mergeText(existing.legacyGeneralNotes,incoming.legacyGeneralNotes,'importierte allgemeine Notizen'),
    importHistory: [...existing.importHistory,...incoming.importHistory],
    importedProjectSnapshots: [...existing.importedProjectSnapshots,...incoming.importedProjectSnapshots],
    entityOverrides: {
      bugs:{...incoming.entityOverrides.bugs,...existing.entityOverrides.bugs},
      ideas:{...incoming.entityOverrides.ideas,...existing.entityOverrides.ideas},
      questions:{...incoming.entityOverrides.questions,...existing.entityOverrides.questions},
      decisions:{...incoming.entityOverrides.decisions,...existing.entityOverrides.decisions}
    }
  });
}
function localStateFromLegacyBackup(payload) {
  const state = defaultLocalState();
  const todo = {...asObject(payload.done),...asObject(payload.todoState)};
  for (const [rawId,value] of Object.entries(todo)) {
    const id = ID_ALIASES[rawId] || rawId;
    const done = value === true || value?.done === true;
    state.batchTaskState[id] = {status:done?'done':'open',updatedAt:nowIso(),source:'legacy-import'};
  }
  for (const [id,value] of Object.entries(asObject(payload.testState))) {
    const raw = asObject(value);
    state.testResults[id] = {
      status:raw.status || (raw.done?'passed':'untested'),device:raw.device||'',browser:raw.browser||'',environment:raw.environment||'',actualResult:raw.actualResult||'',note:raw.note||'',lastTestedAt:raw.lastTestedAt||'',updatedAt:nowIso()
    };
  }
  state.legacyGeneralNotes = typeof payload.generalNotes === 'string' ? payload.generalNotes : typeof payload.notes === 'string' ? payload.notes : '';
  return state;
}
async function importBackupFile(file) {
  if (!file) return;
  if (!confirm('Backup sicher zusammenführen? Bestehende lokale Inhalte werden nicht gelöscht. Bei Konflikten bleiben beide Versionen erhalten.')) return;
  try {
    const payload = JSON.parse(await file.text());
    const schema = payload.schema || 'legacy-unbekannt';
    let importedState;
    if (schema === APP_SCHEMA && payload.localState) importedState = payload.localState;
    else importedState = localStateFromLegacyBackup(payload);
    LOCAL = mergeLocalStates(LOCAL, importedState);
    if (payload.projectDataSnapshot) LOCAL.importedProjectSnapshots.push({importedAt:nowIso(),projectId:payload.projectId||payload.projectDataSnapshot?.project?.id||'unbekannt',updatedAt:payload.projectDataVersion||payload.projectDataSnapshot?.updatedAt||''});
    const screenshotCount = await mergeScreenshots(payload.screenshots);
    LOCAL.importHistory.unshift({id:uniqueId('import'),importedAt:nowIso(),fileName:file.name,schema,summary:`Nicht-destruktiv zusammengeführt; ${screenshotCount} Screenshot-Dateien ergänzt.`});
    refreshUnmappedLegacy();
    addTimeline({title:'Backup importiert',description:`${file.name} · Schema ${schema}`,type:'Backup'},false);
    saveLocal({render:true});
    showToast(`Backup zusammengeführt. ${screenshotCount} Screenshots ergänzt.`,'success');
  } catch (error) {
    showToast(`Import fehlgeschlagen: ${error.message}`,'danger');
  }
}

function resetStatuses() {
  if (!confirm('Vor dem Zurücksetzen sollte ein Backup exportiert sein. Task- und Teststatus jetzt zurücksetzen? Notizen und Screenshots bleiben erhalten.')) return;
  LOCAL.batchTaskState = {};
  for (const id of Object.keys(LOCAL.testResults)) LOCAL.testResults[id] = {...LOCAL.testResults[id],status:'untested',lastTestedAt:'',updatedAt:nowIso()};
  addTimeline({title:'Task- und Teststatus zurückgesetzt',description:'Notizen, persönliche Aufgaben und Screenshots blieben erhalten.',type:'Datenpflege'},false);
  saveLocal({render:true});
  showToast('Status zurückgesetzt; Notizen und Screenshots wurden beibehalten.','success');
}

function openDrawer() {
  $('#drawerBackdrop').classList.remove('hidden');
  $('#mobileDrawer').classList.remove('hidden');
  $('#mobileDrawer').setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden';
}
function closeDrawer() {
  $('#drawerBackdrop').classList.add('hidden');
  $('#mobileDrawer').classList.add('hidden');
  $('#mobileDrawer').setAttribute('aria-hidden','true');
  document.body.style.overflow = '';
}
function bindGlobalEvents() {
  $('#openMenuButton').addEventListener('click',openDrawer);
  $('#moreButton').addEventListener('click',openDrawer);
  $('#closeMenuButton').addEventListener('click',closeDrawer);
  $('#drawerBackdrop').addEventListener('click',closeDrawer);
  $$('.mobile-bottom-nav [data-view]').forEach(button=>button.addEventListener('click',()=>navigate(button.dataset.view)));
  $('#exportButton').addEventListener('click',exportBackup);
  $('#mobileExportButton').addEventListener('click',exportBackup);
  $('#reloadButton').addEventListener('click',loadApplicationData);
  $('#importInput').addEventListener('change',event=>{importBackupFile(event.target.files[0]);event.target.value='';});
  $('#mobileImportInput').addEventListener('change',event=>{importBackupFile(event.target.files[0]);event.target.value='';});
  const searchHandler = event => {
    LOCAL.ui.search = event.target.value;
    $('#globalSearch').value = LOCAL.ui.search;
    $('#mobileSearch').value = LOCAL.ui.search;
    writeLocal(LOCAL_KEY,LOCAL);
    renderNavigation();
    renderCurrentView();
  };
  $('#globalSearch').addEventListener('input',searchHandler);
  $('#mobileSearch').addEventListener('input',searchHandler);
  $('#entryForm').addEventListener('submit',handleDialogSubmit);
  $$('[data-dialog-close]').forEach(button=>button.addEventListener('click',()=>$('#entryDialog').close()));
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeDrawer();});
}

async function loadApplicationData() {
  $('#loadingState').classList.remove('hidden');
  $('#errorState').classList.add('hidden');
  try {
    const [projectResult, legacyResult] = await Promise.all([
      fetchJson('project-data.json',PROJECT_CACHE_KEY),
      fetchJson('todo-data.json',LEGACY_CACHE_KEY)
    ]);
    PROJECT_RAW = projectResult.data;
    LEGACY_RAW = legacyResult.data;
    if (!PROJECT_RAW && !LEGACY_RAW) throw new Error(`Weder project-data.json noch todo-data.json verfügbar. ${projectResult.warning || ''} ${legacyResult.warning || ''}`);
    DATA = normalizeProjectData(PROJECT_RAW,LEGACY_RAW);
    VALIDATION = validateProject(PROJECT_RAW,DATA);
    LOCAL = migrateExistingBrowserState(normalizeLocalState(readLocal(LOCAL_KEY,defaultLocalState())));
    refreshUnmappedLegacy();
    writeLocal(LOCAL_KEY,LOCAL);
    syncLegacyStorage();
    renderApp();
    if (projectResult.source === 'cache' || legacyResult.source === 'cache') showToast('Offline-/Cache-Daten geladen. Lokale Eingaben bleiben verfügbar.');
  } catch (error) {
    $('#loadingState').classList.add('hidden');
    const box = $('#errorState');
    box.classList.remove('hidden');
    box.innerHTML = `<strong>Projekt konnte nicht geladen werden.</strong><p>${esc(error.message)}</p><button class="button button-primary" onclick="location.reload()">Erneut versuchen</button>`;
  }
}

async function init() {
  bindGlobalEvents();
  await loadApplicationData();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
  }
}

document.addEventListener('DOMContentLoaded',init);
