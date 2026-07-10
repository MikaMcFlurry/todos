'use strict';

(() => {
  const PRIMARY_COMMAND_VIEWS = [
    ['dashboard','⌂','Überblick'],
    ['workflow','⇢','Workflow'],
    ['work','▦','Umsetzung'],
    ['quality','✓','Qualität'],
    ['ai','AI','KI / Chats']
  ];

  const FALLBACK_GATE_CHECKLISTS = {
    'workflow-gate-1': [
      {id:'problem-understood',label:'Problem und Ziel sind verständlich beschrieben.'},
      {id:'owner-confirmed',label:'Mika hat Ziel und Nutzen bestätigt.'}
    ],
    'workflow-gate-2': [
      {id:'scope-documented',label:'Scope und Nicht-Ziele sind dokumentiert.'},
      {id:'open-assumptions-visible',label:'Offene Annahmen und Risiken sind sichtbar.'}
    ],
    'workflow-gate-3': [
      {id:'architecture-reviewed',label:'Architektur, Datenmodell und Sicherheitsrahmen sind geprüft.'},
      {id:'acceptance-defined',label:'Akzeptanzkriterien und Teststrategie sind definiert.'}
    ],
    'workflow-gate-4': [
      {id:'handoff-complete',label:'Handoff enthält Ziel, Kontext, erlaubte Dateien und Schutzregeln.'},
      {id:'branch-ready',label:'Arbeitsbranch und erwartetes Ergebnis sind eindeutig.'}
    ],
    'workflow-gate-5': [
      {id:'checks-passed',label:'Automatische und manuelle Prüfungen sind dokumentiert.'},
      {id:'review-complete',label:'Ergebnis, Abweichungen und offene Punkte wurden reviewed.'}
    ],
    'workflow-gate-6': [
      {id:'beta-criteria-met',label:'Beta-/Release-Kriterien sind erfüllt.'},
      {id:'backup-current',label:'Projektstatus, Chats und Handoffs sind aktuell gesichert.'}
    ]
  };

  const originalNormalizeProject = normalizeProject;
  normalizeProject = function normalizeProjectV11(project) {
    const normalized = originalNormalizeProject(project);
    normalized.handoffs = asArray(project?.handoffs || normalized.handoffs);
    return normalized;
  };

  function mergeRecordArray(existing, incoming) {
    const result = [...asArray(existing)];
    const ids = new Set(result.map(item => item?.id).filter(Boolean));
    for (const item of asArray(incoming)) {
      if (!item?.id || ids.has(item.id)) continue;
      result.push(item);
      ids.add(item.id);
    }
    return result;
  }

  function mergeChats(existing, incoming) {
    return mergeRecordArray(existing, incoming);
  }

  function mergeContexts(existing, incoming) {
    const result = asArray(existing).map(item => ({...item,chats:asArray(item.chats)}));
    for (const context of asArray(incoming)) {
      const current = result.find(item => item.id === context.id);
      if (!current) result.push(context);
      else current.chats = mergeChats(current.chats, context.chats);
    }
    return result;
  }

  function mergeAiModels(existing, incoming) {
    const result = asArray(existing).map(item => ({...item,contexts:asArray(item.contexts),chats:asArray(item.chats)}));
    for (const model of asArray(incoming)) {
      const current = result.find(item => item.id === model.id);
      if (!current) result.push(model);
      else {
        current.contexts = mergeContexts(current.contexts, model.contexts);
        current.chats = mergeChats(current.chats, model.chats);
      }
    }
    return result;
  }

  function mergeImportedProjectMetadata(existing, incoming) {
    if (!existing) return normalizeProject(incoming);
    const scalarMerged = {...incoming,...existing};
    const collectionKeys = ['phases','gates','batches','mikaTasks','tests','bugs','ideas','questions','decisions','files','backups','handoffs','timeline','risks','notes'];
    for (const key of collectionKeys) scalarMerged[key] = mergeRecordArray(existing[key], incoming?.[key]);
    scalarMerged.aiModels = mergeAiModels(existing.aiModels, incoming?.aiModels);
    scalarMerged.goals = {
      ...asObject(incoming?.goals),
      ...asObject(existing.goals),
      successCriteria:[...new Set([...asArray(existing.goals?.successCriteria),...asArray(incoming?.goals?.successCriteria)])],
      nonGoals:[...new Set([...asArray(existing.goals?.nonGoals),...asArray(incoming?.goals?.nonGoals)])],
      constraints:[...new Set([...asArray(existing.goals?.constraints),...asArray(incoming?.goals?.constraints)])]
    };
    scalarMerged.workflowState = {
      ...asObject(incoming?.workflowState),
      ...asObject(existing.workflowState),
      gateStatuses:{...asObject(incoming?.workflowState?.gateStatuses),...asObject(existing.workflowState?.gateStatuses)},
      repositoryChecklist:mergeRecordArray(existing.workflowState?.repositoryChecklist?.map((item,index)=>({id:item.id||item.path||`repo-${index}`,...item})),incoming?.workflowState?.repositoryChecklist?.map((item,index)=>({id:item.id||item.path||`repo-import-${index}`,...item}))).map(({id,...item})=>item),
      workflowFiles:mergeRecordArray(existing.workflowState?.workflowFiles,incoming?.workflowState?.workflowFiles),
      routingOverrides:mergeRecordArray(existing.workflowState?.routingOverrides,incoming?.workflowState?.routingOverrides)
    };
    return normalizeProject(scalarMerged);
  }

  const originalNormalizeWorkspaceData = normalizeWorkspaceData;
  normalizeWorkspaceData = function normalizeWorkspaceDataV11(raw, legacy, importedProjects = []) {
    const workspace = originalNormalizeWorkspaceData(raw, legacy, importedProjects);
    for (const imported of asArray(importedProjects)) {
      if (!imported?.id) continue;
      const index = workspace.projects.findIndex(project => project.id === imported.id);
      if (index >= 0) workspace.projects[index] = mergeImportedProjectMetadata(workspace.projects[index], imported);
      else workspace.projects.push(normalizeProject(imported));
    }
    return workspace;
  };

  addImportedProjectSnapshot = function addImportedProjectSnapshotV11(snapshot) {
    if (!snapshot?.id) return false;
    const index = WORKSPACE_LOCAL.importedProjects.findIndex(project => project.id === snapshot.id);
    const signature = `${snapshot.id}:${snapshot.lastUpdated || snapshot.updatedAt || ''}:${JSON.stringify(snapshot).length}`;
    if (index < 0) {
      WORKSPACE_LOCAL.importedProjects.push(snapshot);
      return true;
    }
    const previous = WORKSPACE_LOCAL.importedProjects[index];
    if (JSON.stringify(previous) === JSON.stringify(snapshot)) return false;
    WORKSPACE_LOCAL.importedProjects[index] = mergeImportedProjectMetadata(previous, snapshot);
    if (!WORKSPACE_LOCAL.conflictCopies.some(item => item.signature === signature)) {
      WORKSPACE_LOCAL.conflictCopies.push({
        id:uniqueId('project-metadata-conflict'),
        signature,
        createdAt:nowIso(),
        projectId:snapshot.id,
        type:'project-metadata-snapshot',
        incomingSnapshot:snapshot
      });
    }
    return true;
  };

  function validateImportScope(payload, requestedScope = 'auto') {
    const payloadScope = payload?.scope || 'legacy';
    if (requestedScope === 'project' && payloadScope === 'global') {
      return {ok:false,message:'Dieses globale Backup muss über „Alles importieren“ eingelesen werden. Der Projektimport importiert bewusst keine fremden Projekte.'};
    }
    if (requestedScope === 'global' && payloadScope === 'project') {
      return {ok:false,message:'Dieses Projektbackup muss innerhalb eines geöffneten Projekts über „Projekt importieren“ eingelesen werden.'};
    }
    return {ok:true,payloadScope};
  }

  const originalImportBackupFile = importBackupFile;
  importBackupFile = async function importBackupFileV11(file, requestedScope = 'auto') {
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      const scopeCheck = validateImportScope(payload, requestedScope);
      if (!scopeCheck.ok) {
        showToast(scopeCheck.message,'danger');
        return;
      }
    } catch (error) {
      showToast(`Importdatei ist kein gültiges JSON: ${error.message}`,'danger');
      return;
    }
    return originalImportBackupFile(file, requestedScope);
  };

  const originalValidateWorkspace = validateWorkspace;
  validateWorkspace = function validateWorkspaceV11(raw, workspace) {
    const result = originalValidateWorkspace(raw, workspace);
    for (const project of asArray(workspace.projects)) {
      const seen = new Set();
      for (const handoff of asArray(project.handoffs)) {
        if (!handoff?.id) result.warnings.push(`${project.id}/handoffs: Eintrag ohne ID.`);
        else if (seen.has(handoff.id)) result.errors.push(`${project.id}/handoffs: doppelte ID ${handoff.id}.`);
        else seen.add(handoff.id);
      }
    }
    const templateGates = asArray(workspace.workflowTemplates?.gates);
    if (templateGates.some(gate => !asArray(gate.checklist).length)) result.warnings.push('Mindestens ein globales Workflow-Gate hat keine Checkliste.');
    if (!asArray(workspace.workflowTemplates?.workflowChain).length) result.warnings.push('Globale Workflow-Kette ist nicht dokumentiert.');
    if (!asArray(workspace.workflowTemplates?.handoffTypes).length) result.warnings.push('Handoff-Typen sind nicht dokumentiert.');
    result.errors = [...new Set(result.errors)];
    result.warnings = [...new Set(result.warnings)];
    return result;
  };

  function groupedNavMarkup(active) {
    return PROJECT_NAV_GROUPS.map(group => {
      const groupActive = group.items.some(item => item[0] === active);
      return `<details class="nav-group" ${groupActive?'open':''} data-nav-group="${esc(group.id)}"><summary><span>${esc(group.icon)}</span>${esc(group.label)}</summary><div>${group.items.map(([id,icon,label])=>`<button type="button" data-project-view="${id}" class="${active===id?'active':''}"><span class="nav-icon">${esc(icon)}</span><span>${esc(label)}</span>${navigationCount(id)?`<span class="nav-count">${navigationCount(id)}</span>`:''}</button>`).join('')}</div></details>`;
    }).join('');
  }

  renderProjectNavigation = function renderProjectNavigationV11() {
    const sidebar = $('#desktopProjectNav');
    const drawer = $('#mobileProjectNav');
    const command = $('#projectCommandNav');
    if (!DATA) {
      if (sidebar) sidebar.innerHTML = '';
      if (drawer) drawer.innerHTML = '';
      if (command) command.innerHTML = '';
      return;
    }
    const active = LOCAL.ui.activeView;
    const grouped = groupedNavMarkup(active);
    if (sidebar) sidebar.innerHTML = grouped;
    if (drawer) drawer.innerHTML = grouped;
    if (command) command.innerHTML = PRIMARY_COMMAND_VIEWS.map(([id,icon,label])=>`<button type="button" data-project-view="${id}" class="${active===id?'active':''}"><span class="nav-icon">${esc(icon)}</span><span>${esc(label)}</span>${navigationCount(id)?`<span class="nav-count">${navigationCount(id)}</span>`:''}</button>`).join('');
    $$('[data-project-view]').forEach(button => button.addEventListener('click',()=>navigateProject(button.dataset.projectView)));
    $$('.project-bottom-nav [data-view]').forEach(button=>button.classList.toggle('active',button.dataset.view===active));
    $('#projectMoreButton')?.classList.toggle('active',!PRIMARY_PROJECT_VIEWS.includes(active));
  };

  function syncCommandBar() {
    const bar = $('#projectCommandBar');
    if (!bar) return;
    bar.classList.toggle('hidden',!DATA);
    if (!DATA) return;
    const switcher = $('#projectQuickSwitch');
    switcher.innerHTML = WORKSPACE.projects.map(project=>`<option value="${esc(project.id)}" ${project.id===DATA.id?'selected':''}>${esc(project.shortName||project.name)}</option>`).join('');
    $('#projectCommandSearch').value = currentSearch();
    const overdue = projectStats(DATA).overdueBackups;
    const badge = $('#projectCommandBackupBadge');
    badge.textContent = overdue ? `${overdue} Backup-Hinweis${overdue===1?'':'e'}` : 'Backups ohne offene Warnung';
    badge.className = `badge ${overdue?'badge-danger':'badge-success'}`;
  }

  const originalRenderApp = renderApp;
  renderApp = function renderAppV11() {
    originalRenderApp();
    syncCommandBar();
  };

  const originalBindGlobalEvents = bindGlobalEvents;
  bindGlobalEvents = function bindGlobalEventsV11() {
    originalBindGlobalEvents();
    $('#projectDesktopMoreButton')?.addEventListener('click',openDrawer);
    $('#projectQuickSwitch')?.addEventListener('change',event=>setActiveProject(event.target.value));
    $('#projectCommandSearch')?.addEventListener('input',event=>{
      setCurrentSearch(event.target.value);
      if ($('#globalSearch')) $('#globalSearch').value = event.target.value;
      if ($('#mobileSearch')) $('#mobileSearch').value = event.target.value;
      renderApp();
    });
  };

  function gateChecklist(gate) {
    const template = asArray(WORKSPACE.workflowTemplates?.gates).find(item => item.id === gate.id);
    return asArray(gate.checklist).length ? gate.checklist : asArray(template?.checklist).length ? template.checklist : FALLBACK_GATE_CHECKLISTS[gate.id] || [];
  }

  renderWorkflow = function renderWorkflowV11() {
    const phases = WORKSPACE.workflowTemplates.lifecyclePhases;
    const currentPhaseId = DATA.workflowState.currentLifecyclePhaseId;
    const gateOverrides = asObject(LOCAL.gateOverrides);
    const chain = asArray(WORKSPACE.workflowTemplates.workflowChain);
    const handoffTypes = asArray(WORKSPACE.workflowTemplates.handoffTypes);
    return `${viewHeader('Phasen, Gates & Handoffs','Standardisierter KI-Projektlebenszyklus mit prüfbaren Gate-Kriterien, lokaler Mika-Freigabe und Handoff-Readiness.')}
      <section class="panel"><div class="section-title"><div><p class="eyebrow">Lebenszyklus</p><h3>0–10 Standardphasen</h3></div><span class="badge">aktuell: ${esc(phases.find(item=>item.id===currentPhaseId)?.name||'nicht gesetzt')}</span></div><div class="phase-roadmap">${phases.map(phase=>`<div class="phase-step ${phase.id===currentPhaseId?'current':''}"><span>${phase.order}</span><div><strong>${esc(phase.name)}</strong><small>${phase.id===currentPhaseId?'Aktuelle Workflow-Phase':''}</small></div></div>`).join('')}</div></section>
      <section class="panel"><div class="section-title"><div><p class="eyebrow">Mika Approval</p><h3>Projekt-Gates</h3></div><span class="badge">lokal dokumentierte Freigaben</span></div><div class="gate-grid">${DATA.gates.map(gate=>{const override=asObject(gateOverrides[gate.id]),status=override.status||gate.status||DATA.workflowState.gateStatuses[gate.id]||'needs-review',checkState=asObject(override.checklistState),checks=gateChecklist(gate);return`<article class="gate-card"><div class="item-head"><div><span class="id-label">${esc(gate.id)}</span><h4>${esc(gate.name)}</h4></div>${statusBadge(status)}</div><label><span class="field-label">Gate-Status</span><select data-gate-status="${esc(gate.id)}">${selectOptions([['needs-review','Prüfung nötig'],['blocked','Blockiert'],['approved','Freigegeben'],['done','Erledigt']],status)}</select></label><div class="gate-checklist-ui">${checks.map(check=>`<label class="gate-check-item"><input type="checkbox" data-gate-check="${esc(gate.id)}" data-gate-check-id="${esc(check.id)}" ${checkState[check.id]?'checked':''}><span>${esc(check.label)}</span></label>`).join('')||'<span class="small">Keine Checkliste gepflegt.</span>'}</div><label class="gate-mika-approval"><input type="checkbox" data-gate-mika="${esc(gate.id)}" ${override.approvedByMika?'checked':''}><span>Mika-Freigabe lokal dokumentiert${override.approvedAt?` · ${esc(compactDate(override.approvedAt))}`:''}</span></label><label class="gate-blocker-field"><span class="field-label">Blocker / offene Punkte</span><textarea data-gate-blocker="${esc(gate.id)}" placeholder="Nur lokal gespeichert">${esc(override.blockerNote||asArray(gate.blockers).join('\n'))}</textarea></label></article>`}).join('')||emptyState('Keine Gates gepflegt.')}</div></section>
      <section class="panel"><div class="section-title"><div><p class="eyebrow">AI Workflow</p><h3>Vom Projektkontext bis zum gesicherten Review</h3></div><span class="badge">keine automatische Chat-Erfassung</span></div><div class="project-workflow-chain">${chain.map((step,index)=>`<div class="workflow-chain-step"><span>Schritt ${index+1}</span><strong>${esc(step.label||step)}</strong></div>`).join('')}</div><div class="handoff-flow-note"><strong>Handoff-Typen:</strong> ${handoffTypes.map(item=>esc(item.name||item)).join(' · ')||'Noch nicht gepflegt'}</div></section>
      <div class="two-column-grid"><section class="panel"><div class="section-title"><div><p class="eyebrow">Repository</p><h3>Standardstruktur</h3></div><span class="badge">Leitfaden</span></div><div class="checklist-list">${DATA.workflowState.repositoryChecklist.map(item=>`<div class="checklist-row"><span class="check-dot status-${esc(item.status)}"></span><code>${esc(item.path)}</code>${statusBadge(item.status)}</div>`).join('')||emptyState('Keine Repository-Checkliste.')}</div></section><section class="panel"><div class="section-title"><div><p class="eyebrow">Workflow-Dateien</p><h3>Nächste Dokumente</h3></div><span class="badge">${DATA.workflowState.workflowFiles.length}</span></div>${[...DATA.workflowState.workflowFiles].sort((a,b)=>String(a.priority).localeCompare(String(b.priority))).map(item=>`<div class="compact-row"><div><strong>${esc(item.name)}</strong><span>${esc(item.id)}</span></div><div>${priorityBadge(item.priority)} ${statusBadge(item.status)}</div></div>`).join('')||emptyState('Keine Workflow-Dateien.')}</section></div>`;
  };

  const originalRenderAI = renderAI;
  renderAI = function renderAIV11() {
    const base = originalRenderAI();
    const chain = asArray(WORKSPACE.workflowTemplates.workflowChain);
    return `${base}<section class="panel"><div class="section-title"><div><p class="eyebrow">Arbeitskette</p><h3>Chat → Handoff → Umsetzung → Review → Backup</h3></div><span class="badge badge-warning">bewusst manuell</span></div><div class="project-workflow-chain">${chain.map((step,index)=>`<div class="workflow-chain-step"><span>${index+1}</span><strong>${esc(step.label||step)}</strong></div>`).join('')}</div><div class="import-scope-note"><span>ℹ</span><span>ChatGPT-Projekte, Masterchat und Subchats werden als Struktur und Backup-Status verwaltet. Die statische App liest keine Gesprächsinhalte selbstständig aus.</span></div></section>`;
  };

  const originalRenderFiles = renderFiles;
  renderFiles = function renderFilesV11() {
    const base = originalRenderFiles();
    const backupHandoffs = mergeById(LOCAL.backups,DATA.backups).filter(item=>item.type==='handoff').map(item=>({id:item.id,title:item.title||item.projectState||'Handoff',status:item.status||'tracked',date:item.date,reference:item.path||'',source:'Backup-Register'}));
    const chatRefs = flattenProjectChats(DATA).flatMap(chat=>asArray(chat.relatedHandoffs).map((ref,index)=>({id:`${chat.id}-handoff-${index}`,title:typeof ref==='string'?ref:ref.title||ref.id||'Handoff',status:typeof ref==='object'?ref.status||'linked':'linked',date:typeof ref==='object'?ref.date:null,reference:typeof ref==='object'?ref.path||ref.id||'':ref,source:chat.name})));
    const handoffs = mergeRecordArray(mergeRecordArray(DATA.handoffs,backupHandoffs),chatRefs);
    return `${base}<section class="panel"><div class="section-title"><div><p class="eyebrow">Handoffs</p><h3>Übergaben zwischen Chats, Modellen und Implementierungsbatches</h3></div><button class="button button-small" data-open-dialog="backup">Handoff dokumentieren</button></div><div class="handoff-grid">${handoffs.map(item=>`<article class="handoff-card"><div class="item-head"><div><span class="id-label">${esc(item.id)}</span><h4>${esc(item.title||item.name||'Handoff')}</h4></div>${statusBadge(item.status||'tracked')}</div><p class="small">${esc(item.source||item.type||'Projekt')}</p>${item.date?`<span class="badge">${esc(compactDate(item.date))}</span>`:''}${item.reference?`<code>${esc(item.reference)}</code>`:''}</article>`).join('')||emptyState('Noch kein Handoff verknüpft. Nutze einen manuellen Backup-/Handoff-Eintrag oder eine bereinigte Projektdatei.')}</div><div class="import-scope-note"><span>🔒</span><span>Handoff-Dateien mit privaten Chat-Zusammenfassungen gehören in ein privates Repository oder in lokale, bewusst exportierte Backups.</span></div></section>`;
  };

  const originalBindViewEvents = bindViewEvents;
  bindViewEvents = function bindViewEventsV11() {
    originalBindViewEvents();
    $$('[data-gate-check]').forEach(input=>input.addEventListener('change',event=>{
      const gateId=event.target.dataset.gateCheck,checkId=event.target.dataset.gateCheckId,current=asObject(LOCAL.gateOverrides[gateId]);
      LOCAL.gateOverrides[gateId]={...current,checklistState:{...asObject(current.checklistState),[checkId]:event.target.checked},updatedAt:nowIso()};
      saveLocal({timeline:{title:`Gate-Check ${gateId}: ${checkId}`,description:event.target.checked?'Kriterium erfüllt.':'Kriterium wieder geöffnet.',type:'gate',targetView:'workflow'}});
    }));
    $$('[data-gate-mika]').forEach(input=>input.addEventListener('change',event=>{
      const gateId=event.target.dataset.gateMika,current=asObject(LOCAL.gateOverrides[gateId]);
      LOCAL.gateOverrides[gateId]={...current,approvedByMika:event.target.checked,approvedAt:event.target.checked?nowIso():null,updatedAt:nowIso()};
      saveLocal({render:true,timeline:{title:`Mika-Freigabe ${gateId}: ${event.target.checked?'erteilt':'zurückgenommen'}`,description:'Lokale Gate-Freigabe aktualisiert.',type:'decision',targetView:'workflow'}});
    }));
    $$('[data-gate-blocker]').forEach(area=>area.addEventListener('change',event=>{
      const gateId=event.target.dataset.gateBlocker,current=asObject(LOCAL.gateOverrides[gateId]);
      LOCAL.gateOverrides[gateId]={...current,blockerNote:event.target.value,updatedAt:nowIso()};
      saveLocal({timeline:{title:`Gate-Blocker ${gateId} aktualisiert`,description:'Lokaler Blocker-/Notizstand gespeichert.',type:'gate',targetView:'workflow'}});
    }));
  };

  window.__PM_TOOL_TEST_HOOKS__ = {
    validateImportScope,
    mergeImportedProjectMetadata,
    gateChecklistFallbacks:FALLBACK_GATE_CHECKLISTS
  };
})();
