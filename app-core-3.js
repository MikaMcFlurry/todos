function validateWorkspace(raw, workspace) {
  const errors = [], warnings = [];
  if (!raw || typeof raw !== 'object') errors.push('project-data.json fehlt oder ist kein JSON-Objekt.');
  if (raw && raw.schema !== WORKSPACE_SCHEMA) warnings.push(`Kompatibilitätsmodus für Schema ${raw.schema || raw.schemaVersion || 'unbekannt'} aktiv.`);
  if (!Array.isArray(workspace.projects)) errors.push('projects muss ein Array sein.');
  if (workspace.projects.length < 2) warnings.push('Weniger als zwei Projekte im Workspace.');
  const projectIds = new Set();
  for (const project of workspace.projects) {
    if (!project.id) { errors.push('Projekt ohne ID.'); continue; }
    if (projectIds.has(project.id)) errors.push(`Doppelte Projekt-ID ${project.id}.`);
    projectIds.add(project.id);
    const collections=['phases','gates','batches','mikaTasks','tests','bugs','ideas','questions','decisions','files','backups','timeline','risks','notes'];
    for (const key of collections) {
      if (!Array.isArray(project[key])) errors.push(`${project.id}: ${key} muss ein Array sein.`);
      const seen=new Set();
      for (const item of asArray(project[key])) {
        if (!item.id) warnings.push(`${project.id}/${key}: Eintrag ohne ID.`);
        else if (seen.has(item.id)) errors.push(`${project.id}/${key}: doppelte ID ${item.id}.`);
        else seen.add(item.id);
      }
    }
    const taskIds=new Set();
    for (const batch of project.batches) for (const task of asArray(batch.tasks)) {
      if (!task.id) warnings.push(`${project.id}/${batch.id}: Task ohne ID.`);
      else if (taskIds.has(task.id)) errors.push(`${project.id}: doppelte Task-ID ${task.id}.`);
      else taskIds.add(task.id);
    }
    const batchIds=new Set(project.batches.map(item=>item.id));
    for (const test of project.tests) {
      for (const taskId of asArray(test.relatedTaskIds)) if(!taskIds.has(taskId)) warnings.push(`${project.id}/${test.id}: unbekannte Task-ID ${taskId}.`);
      for (const batchId of asArray(test.relatedBatchIds)) if(!batchIds.has(batchId)) warnings.push(`${project.id}/${test.id}: unbekannte Batch-ID ${batchId}.`);
    }
  }
  const serialized=JSON.stringify(raw||{});
  if(/data:image\//i.test(serialized))errors.push('Öffentliche Projektdaten enthalten eingebettete Bilder.');
  if(/(api[_-]?key|access[_-]?token|secret)["']?\s*[:=]\s*["'][^"']{8,}/i.test(serialized))errors.push('Möglicher Secret-/Token-Wert in project-data.json.');
  return{errors:[...new Set(errors)],warnings:[...new Set(warnings)]};
}
function projectById(projectId){return WORKSPACE?.projects?.find(project=>project.id===projectId)||null}
function setActiveProject(projectId,{render=true}={}){if(!projectId){ACTIVE_PROJECT_ID=null;DATA=null;LOCAL=null;WORKSPACE_LOCAL.ui.activeProjectId=null;saveWorkspace({render});return}const project=projectById(projectId);if(!project)return showToast('Projekt nicht gefunden.','danger');ACTIVE_PROJECT_ID=project.id;DATA=project;LOCAL=ensureProjectLocal(project.id);const rememberedView=WORKSPACE_LOCAL.ui.projectViews[project.id]||LOCAL.ui.activeView||'dashboard';LOCAL.ui.activeView=projectViewExists(rememberedView)?rememberedView:'dashboard';WORKSPACE_LOCAL.ui.activeProjectId=project.id;saveWorkspace({render})}
function projectViewExists(view){return PROJECT_NAV_GROUPS.some(group=>group.items.some(item=>item[0]===view))}
function goWorkspace(){setActiveProject(null);window.scrollTo({top:0,behavior:'smooth'})}
function navigateProject(view){if(!DATA||!projectViewExists(view))return;LOCAL.ui.activeView=view;WORKSPACE_LOCAL.ui.projectViews[ACTIVE_PROJECT_ID]=view;saveLocal();closeDrawer();renderApp();$('#mainContent')?.focus({preventScroll:true});window.scrollTo({top:0,behavior:'smooth'})}
function currentSearch(){if(!ACTIVE_PROJECT_ID)return WORKSPACE_LOCAL.ui.globalSearch||'';return WORKSPACE_LOCAL.ui.searches[ACTIVE_PROJECT_ID]||''}
function setCurrentSearch(value){if(!ACTIVE_PROJECT_ID)WORKSPACE_LOCAL.ui.globalSearch=value;else WORKSPACE_LOCAL.ui.searches[ACTIVE_PROJECT_ID]=value;saveWorkspace()}
function matchesSearch(...values){const query=currentSearch().trim().toLocaleLowerCase('de');if(!query)return true;return values.flat(Infinity).filter(Boolean).some(value=>String(value).toLocaleLowerCase('de').includes(query))}
function taskDone(id,projectId=ACTIVE_PROJECT_ID){return ensureProjectLocal(projectId).batchTaskState[id]?.status==='done'}
function testResult(id,projectId=ACTIVE_PROJECT_ID){return{status:'untested',device:'',browser:'',environment:'',actualResult:'',note:'',lastTestedAt:'',...asObject(ensureProjectLocal(projectId).testResults[id])}}
function getOverride(collection,id){return asObject(LOCAL?.entityOverrides?.[collection]?.[id])}
function combinedCollection(key){if(!DATA||!LOCAL)return[];return mergeById(asArray(LOCAL[key]),asArray(DATA[key])).map(item=>({...item,...getOverride(key,item.id)}))}
function combinedMikaTasks(projectId=ACTIVE_PROJECT_ID){const project=projectById(projectId),local=ensureProjectLocal(projectId);return mergeById(local.mikaTasks,project?.mikaTasks).map(item=>({status:'open',priority:'P2',...item}))}
function allProjectTaskIds(project){return new Set(asArray(project?.batches).flatMap(batch=>asArray(batch.tasks).map(task=>task.id)))}
function refreshUnmappedLegacy(projectId=ACTIVE_PROJECT_ID){if(!projectId)return;const project=projectById(projectId),state=ensureProjectLocal(projectId),tasks=allProjectTaskIds(project),tests=new Set(asArray(project?.tests).map(test=>test.id));state.unmappedLegacyItems.todoState={};state.unmappedLegacyItems.testState={};for(const[id,value]of Object.entries(state.batchTaskState))if(!tasks.has(id))state.unmappedLegacyItems.todoState[id]=value;for(const[id,value]of Object.entries(state.testResults))if(!tests.has(id))state.unmappedLegacyItems.testState[id]=value}
function projectStats(project){const local=ensureProjectLocal(project.id),tasks=project.batches.flatMap(batch=>asArray(batch.tasks)),taskDoneCount=tasks.filter(task=>local.batchTaskState[task.id]?.status==='done').length,testsDone=project.tests.filter(test=>TEST_COMPLETE.has(({status:'untested',...asObject(local.testResults[test.id])}).status)).length,mikaTasks=mergeById(local.mikaTasks,project.mikaTasks),openMika=mikaTasks.filter(item=>!['done','archived'].includes(item.status||'open')).length,allBugs=mergeById(local.bugs,project.bugs).map(item=>({...item,...asObject(local.entityOverrides.bugs[item.id])})),openBugs=allBugs.filter(item=>!['behoben','done','closed','archived'].includes(String(item.status).toLowerCase())).length,openQuestions=mergeById(local.questions,project.questions).map(item=>({...item,...asObject(local.entityOverrides.questions[item.id])})).filter(item=>['offen','in-review','blocked'].includes(String(item.status).toLowerCase())).length,activeDecisions=mergeById(local.decisions,project.decisions).filter(item=>String(item.status).toLowerCase()==='review').length,chats=flattenProjectChats(project),overdueBackups=chats.filter(chat=>['needed','overdue'].includes(String(chat.backupStatus).toLowerCase())).length,total=tasks.length,progress=Number.isFinite(Number(project.progress))?Number(project.progress):(total?Math.round(taskDoneCount/total*100):0);return{tasks,taskDoneCount,testsDone,openMika,openBugs,openQuestions,activeDecisions,overdueBackups,progress}}
function flattenProjectChats(project){const chats=[],local=WORKSPACE_LOCAL?.projectStates?.[project?.id],overrides=asObject(local?.chatOverrides);for(const model of asArray(project?.aiModels)){for(const chat of asArray(model.chats))chats.push({...chat,...asObject(overrides[chat.id]),modelId:model.id,modelName:model.name,contextName:''});for(const context of asArray(model.contexts))for(const chat of asArray(context.chats))chats.push({...chat,...asObject(overrides[chat.id]),modelId:model.id,modelName:model.name,contextId:context.id,contextName:context.name})}return chats}
function combinedTimeline(projectId=ACTIVE_PROJECT_ID){const project=projectById(projectId),local=ensureProjectLocal(projectId);return[...asArray(local.timeline),...asArray(project?.timeline)].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')))}
function statusBadge(value){const text=value||'offen',lower=String(text).toLowerCase();let cls='badge badge-blue';if(/(done|bestanden|abgeschlossen|approved|active|aktiv|tracked|current|available|behoben)/.test(lower))cls='badge badge-success';else if(/(kritisch|fehl|offen|hoch|overdue|needed|warning)/.test(lower))cls='badge badge-danger';else if(/(planung|geplant|block|mittel|review|testing|teilweise|needs-review|planned|manual|optional)/.test(lower))cls='badge badge-warning';return`<span class="${cls}">${esc(text)}</span>`}
function priorityBadge(value){if(!value)return'';const cls=value==='P0'?'badge-danger':value==='P1'?'badge-warning':'badge-blue';return`<span class="badge ${cls}">${esc(value)}</span>`}
function selectOptions(options,selected){return options.map(option=>{const[value,label]=Array.isArray(option)?option:[option,option||'—'];return`<option value="${esc(value)}" ${value===selected?'selected':''}>${esc(label)}</option>`}).join('')}
function mergeText(existing,imported,label='Import'){const a=String(existing||'').trim(),b=String(imported||'').trim();if(!b||a===b)return a;if(!a)return b;return`${a}\n\n--- ${label} ${new Date().toLocaleString('de-DE')} ---\n${b}`}
