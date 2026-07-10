function viewHeader(title, description, actions = '') {
  return `<div class="view-head"><div><p class="eyebrow">${esc(DATA.project.name || 'Projekt')}</p><h2>${esc(title)}</h2><p>${esc(description)}</p></div>${actions ? `<div class="view-actions">${actions}</div>` : ''}</div>`;
}
function emptyState(text) { return `<div class="empty">${esc(text)}</div>`; }
function progressMetric(label, done, total, color = '') {
  const pct = total ? Math.round(done / total * 100) : 0;
  return `<div class="metric"><span class="metric-label">${esc(label)}</span><span class="metric-value">${done}/${total}</span><div class="progress ${color}"><span style="width:${pct}%"></span></div><p class="small">${pct}% abgeschlossen</p></div>`;
}

function projectStats() {
  const tasks = DATA.batches.flatMap(batch => asArray(batch.tasks));
  const tasksDone = tasks.filter(task => taskDone(task.id)).length;
  const testsDone = DATA.tests.filter(test => TEST_COMPLETE.has(testResult(test.id).status)).length;
  const mikaTasks = combinedMikaTasks();
  const mikaDone = mikaTasks.filter(item => item.status === 'done').length;
  const openBugs = combinedCollection('bugs').filter(item => !['done','closed','archived','behoben'].includes(String(item.status).toLowerCase())).length;
  return { tasks, tasksDone, testsDone, mikaTasks, mikaDone, openBugs };
}

function renderDashboard() {
  const stats = projectStats();
  const nextSteps = asArray(DATA.project.nextSteps).slice(0,3);
  const criticalRisks = DATA.risks.filter(risk => String(risk.severity).toLowerCase() === 'kritisch' && String(risk.status).toLowerCase() !== 'behandelt');
  const failedTests = DATA.tests.filter(test => ['failed','blocked'].includes(testResult(test.id).status));
  const mikaQuestions = combinedCollection('questions').filter(question => question.status === 'offen' && /mika/i.test(question.answerOwner || '')).slice(0,5);
  const activeAi = DATA.aiBatches.find(batch => ['In Bearbeitung','Testing','Review nötig'].includes(batch.status)) || DATA.aiBatches[0];
  const timeline = combinedTimeline().slice(0,5);

  return `${viewHeader('Dashboard','Kompakter Wiedereinstieg: Projektstatus, nächste Schritte, Blocker, Tests und lokale Aufgaben.')}
    <div class="grid three">
      ${progressMetric('Batch-Aufgaben',stats.tasksDone,stats.tasks.length)}
      ${progressMetric('Tests abgeschlossen',stats.testsDone,DATA.tests.length,'blue')}
      ${progressMetric('Mika-Aufgaben',stats.mikaDone,stats.mikaTasks.length,'green')}
    </div>
    <div class="grid two" style="margin-top:14px">
      <section class="card card-flat">
        <div class="section-title"><h3>Projektstatus</h3>${statusBadge(DATA.project.status)}</div>
        <div class="kv"><strong>Modus</strong><span>${esc(DATA.project.mode || '—')}</span></div>
        <div class="kv"><strong>Aktuelle Phase</strong><span>${esc(DATA.phases.find(p => p.id === DATA.project.currentPhaseId)?.title || '—')}</span></div>
        <div class="kv"><strong>Letzte Datenänderung</strong><span>${esc(DATA.updatedAt || '—')}</span></div>
        <div class="kv"><strong>Offene Bugs</strong><span>${stats.openBugs}</span></div>
      </section>
      <section class="card card-flat">
        <div class="section-title"><h3>Nächste 3 Schritte</h3></div>
        ${nextSteps.length ? `<ol class="validation-list">${nextSteps.map(step => `<li>${esc(step)}</li>`).join('')}</ol>` : emptyState('Keine nächsten Schritte gepflegt.')}
      </section>
      <section class="card card-flat ${criticalRisks.length || failedTests.length ? 'card-danger' : ''}">
        <div class="section-title"><h3>Kritische Blocker</h3><span class="badge badge-danger">${criticalRisks.length + failedTests.length}</span></div>
        ${criticalRisks.map(risk => `<div class="list-item"><strong>${esc(risk.title)}</strong><p class="small">${esc(risk.mitigation || risk.impact)}</p></div>`).join('')}
        ${failedTests.map(test => `<div class="list-item"><strong>${esc(test.id)} · ${esc(test.title)}</strong><p class="small">Teststatus: ${esc(testResult(test.id).status)}</p></div>`).join('')}
        ${!criticalRisks.length && !failedTests.length ? emptyState('Keine kritischen offenen Blocker im aktuellen Datenstand.') : ''}
      </section>
      <section class="card card-flat">
        <div class="section-title"><h3>Offene Mika-Entscheidungen</h3><button class="button button-small" data-open-dialog="question">Frage ergänzen</button></div>
        ${mikaQuestions.length ? mikaQuestions.map(question => `<div class="list-item"><strong>${esc(question.title)}</strong><p class="small">${esc(question.impact || '')}</p></div>`).join('') : emptyState('Keine offenen Fragen mit Antwortverantwortung Mika.')}
      </section>
      <section class="card card-flat">
        <div class="section-title"><h3>Aktiver KI-Batch</h3>${activeAi ? statusBadge(activeAi.status) : ''}</div>
        ${activeAi ? `<strong>${esc(activeAi.id)} · ${esc(activeAi.title)}</strong><p>${esc(activeAi.goal || '')}</p><div class="meta-row">${priorityBadge(activeAi.priority)}${activeAi.branch ? `<span class="badge">${esc(activeAi.branch)}</span>` : ''}</div>` : emptyState('Kein KI-Batch gepflegt.')}
      </section>
      <section class="card card-flat">
        <div class="section-title"><h3>Letzte Änderungen</h3><button class="button button-small" data-nav-jump="timeline">Timeline öffnen</button></div>
        ${timeline.map(item => `<div class="list-item"><strong>${esc(item.title)}</strong><p class="small">${esc(item.type || '')} · ${compactDate(item.date)}</p></div>`).join('') || emptyState('Keine Timeline-Einträge.')}
      </section>
    </div>
    <section class="card" style="margin-top:14px">
      <div class="section-title"><h3>Schnellnotiz</h3><span class="badge">nur lokal</span></div>
      <div class="form-grid">
        <div class="full"><textarea id="dashboardQuickNote" placeholder="Beobachtung, Idee, offene Frage oder nächste Aktion …"></textarea></div>
        <div><select id="dashboardQuickNoteType"><option value="note">Notiz</option><option value="idea">Idee</option><option value="question">Frage</option><option value="task">Mika-Aufgabe</option></select></div>
        <div><button class="button button-primary" id="saveDashboardQuickNote" type="button">Lokal speichern</button></div>
      </div>
    </section>`;
}

function renderScope() {
  const p = DATA.project;
  return `${viewHeader('Projektziel & Scope','Verbindlicher Überblick über Ziel, Problem, Zielgruppe, Erfolgskriterien, Einschränkungen und Nicht-Ziele.')}
    <div class="grid two">
      <section class="card card-flat"><h3>Hauptziel</h3><p>${esc(p.goal || p.description || '—')}</p></section>
      <section class="card card-flat"><h3>Problem</h3><p>${esc(p.problem || '—')}</p></section>
      <section class="card card-flat"><h3>Zielgruppe</h3><p>${esc(p.targetGroup || '—')}</p></section>
      <section class="card card-flat"><h3>Kurzbeschreibung</h3><p>${esc(p.description || '—')}</p></section>
      <section class="card card-flat"><h3>Erfolgskriterien</h3>${listMarkup(p.successCriteria)}</section>
      <section class="card card-flat"><h3>Wichtige Einschränkungen</h3>${listMarkup(p.constraints)}</section>
      <section class="card card-flat"><h3>Nicht-Ziele</h3>${listMarkup(p.nonGoals)}</section>
      <section class="card card-flat"><h3>Scope-Drift-Prüfung</h3><p>Neue Ideen bleiben zunächst im Ideenbereich. Erst nach einer bewussten Entscheidung werden sie als Batch oder Aufgabe eingeplant.</p><button class="button button-small" data-nav-jump="ideas">Ideen prüfen</button></section>
    </div>`;
}
function listMarkup(items) {
  return asArray(items).length ? `<ul class="validation-list">${items.map(item => `<li>${esc(item)}</li>`).join('')}</ul>` : emptyState('Keine Einträge gepflegt.');
}

function renderPhases() {
  const phases = DATA.phases.filter(item => matchesSearch(item.id,item.title,item.description,item.status));
  return `${viewHeader('Phasen','Fortschritt, Status und Zweck der größeren Projektabschnitte.')}
    <div class="stack">${phases.map(phase => `<section class="card card-flat">
      <div class="item-head"><div><p class="eyebrow">${esc(phase.id)}</p><h3>${esc(phase.title)}</h3></div>${statusBadge(phase.status)}</div>
      <p>${esc(phase.description || '')}</p>
      <div class="progress"><span style="width:${Number(phase.progress || 0)}%"></span></div>
      <div class="meta-row"><span class="badge">${Number(phase.progress || 0)}%</span><span class="badge">Start: ${esc(phase.startDate || 'offen')}</span><span class="badge">Ziel: ${esc(phase.targetDate || 'offen')}</span></div>
    </section>`).join('') || emptyState('Keine passenden Phasen gefunden.')}</div>`;
}

function renderBatches() {
  const batches = DATA.batches.filter(batch => {
    const archived = ['Archiviert','Ersetzt'].includes(batch.status);
    return (LOCAL.ui.showArchived || !archived || batch.source !== 'legacy-todo-data') && matchesSearch(batch.id,batch.title,batch.description,batch.status,batch.tasks?.map(t => [t.id,t.title,t.tag]));
  });
  return `${viewHeader('Batches','KI-/Implementierungsarbeit getrennt von persönlichen Mika-Aufgaben. Historische Todos erscheinen als stabile Batch-Tasks.',`<label class="checkbox-row"><input id="showArchivedBatches" type="checkbox" ${LOCAL.ui.showArchived ? 'checked' : ''}><span class="small">Archivierte anzeigen</span></label>`) }
    <div class="stack">${batches.map(batch => {
      const tasks = asArray(batch.tasks);
      const done = tasks.filter(task => taskDone(task.id)).length;
      const pct = tasks.length ? Math.round(done/tasks.length*100) : 0;
      return `<section class="card batch-card">
        <div class="batch-summary"><div><div class="meta-row">${priorityBadge(batch.priority)}${statusBadge(batch.status)}<span class="badge">${esc(batch.id)}</span></div><h3>${esc(batch.title)}</h3><p>${esc(batch.description || '')}</p></div><span class="badge ${pct===100?'badge-success':''}">${done}/${tasks.length} · ${pct}%</span></div>
        <div class="meta-row">${batch.phaseId ? `<span class="badge">Phase: ${esc(batch.phaseId)}</span>` : ''}${batch.aiModel ? `<span class="badge">KI: ${esc(batch.aiModel)}</span>` : ''}${batch.batchBranch ? `<span class="badge">Branch: ${esc(batch.batchBranch)}</span>` : ''}${batch.time ? `<span class="badge">${esc(batch.time)}</span>` : ''}</div>
        ${tasks.length ? `<div class="batch-tasks">${tasks.map(task => `<label class="task-row ${taskDone(task.id)?'done':''}"><input type="checkbox" data-task-id="${esc(task.id)}" ${taskDone(task.id)?'checked':''}><span class="task-text"><strong>${esc(task.id)}</strong><br>${esc(task.title)}</span>${task.tag?`<span class="badge">${esc(task.tag)}</span>`:''}</label>`).join('')}</div>` : emptyState('Keine Tasks in diesem Batch.')}
        ${asArray(batch.acceptanceCriteria).length ? `<details class="details"><summary>Akzeptanzkriterien</summary>${listMarkup(batch.acceptanceCriteria)}</details>` : ''}
      </section>`;
    }).join('') || emptyState('Keine passenden Batches gefunden.')}</div>`;
}

function combinedMikaTasks() {
  return mergeById(LOCAL.mikaTasks, DATA.mikaTasks).map(item => ({status:'open',priority:'P2',...item}));
}
function renderMikaTasks() {
  const tasks = combinedMikaTasks().filter(item => (LOCAL.ui.showArchived || item.status !== 'archived') && matchesSearch(item.id,item.title,item.description,item.category,item.status,item.priority));
  return `${viewHeader('Mika-Aufgaben','Nur Aufgaben, die Mika selbst erledigen oder entscheiden muss. Sie werden lokal gespeichert.',`<button class="button button-primary" data-open-dialog="mikaTask">Mika-Aufgabe anlegen</button>`) }
    <div class="filter-row card card-flat"><label class="checkbox-row"><input id="showArchivedMika" type="checkbox" ${LOCAL.ui.showArchived?'checked':''}><span>Archivierte anzeigen</span></label></div>
    <div class="stack" style="margin-top:14px">${tasks.map(task => `<article class="card card-flat">
      <div class="item-head"><div><div class="meta-row">${priorityBadge(task.priority)}<span class="badge">${esc(task.category || 'Allgemein')}</span><span class="badge">${esc(task.id)}</span></div><h3>${esc(task.title)}</h3></div>${statusBadge(task.status)}</div>
      <p>${esc(task.description || '')}</p>
      <div class="meta-row">${task.dueDate?`<span class="badge">Fällig: ${esc(task.dueDate)}</span>`:''}${task.projectRef?`<span class="badge">Bezug: ${esc(task.projectRef)}</span>`:''}</div>
      <div class="inline-actions" style="margin-top:10px"><select class="status-select" data-mika-status="${esc(task.id)}">${selectOptions([['open','Offen'],['in-progress','In Bearbeitung'],['blocked','Blockiert'],['done','Erledigt'],['archived','Archiviert']],task.status)}</select></div>
    </article>`).join('') || emptyState('Noch keine persönlichen Mika-Aufgaben vorhanden.')}</div>`;
}

function renderTests() {
  const tests = DATA.tests.filter(test => matchesSearch(test.id,test.title,test.suite,test.suiteTitle,test.when,test.relatedTaskIds,testResult(test.id).note,testResult(test.id).actualResult));
  return `${viewHeader('Tests / QA','Strukturierte Testresultate mit Status, Gerät, Browser, Umgebung, tatsächlichem Ergebnis, Notizen und lokalen Screenshots.')}
    <div class="stack">${tests.map(test => {
      const result = testResult(test.id);
      return `<article class="card test-card" data-status="${esc(result.status)}">
        <div class="item-head"><div><div class="meta-row"><span class="badge badge-blue">${esc(test.id)}</span><span class="badge">${esc(test.suite || '')}</span><span class="badge">${esc(test.when || '')}</span></div><h3>${esc(test.title)}</h3><p class="small">${esc(test.suiteTitle || '')}</p></div>${statusBadge(TEST_STATUSES.find(x=>x[0]===result.status)?.[1] || result.status)}</div>
        <div class="test-layout">
          <div>
            <div class="test-instructions"><div><strong>Schritte</strong><ol>${asArray(test.steps).map(step=>`<li>${esc(step)}</li>`).join('')}</ol></div><div><strong>Erwartung</strong><ul>${asArray(test.expected).map(step=>`<li>${esc(step)}</li>`).join('')}</ul></div></div>
            <div class="meta-row">${asArray(test.relatedTaskIds).map(id=>`<span class="badge">Task ${esc(id)}</span>`).join('')}${asArray(test.relatedBatchIds).map(id=>`<span class="badge">Batch ${esc(id)}</span>`).join('')}</div>
            <div class="screenshot-grid" data-screenshot-grid="${esc(test.id)}"></div>
          </div>
          <div class="test-controls">
            <label><span class="field-label">Teststatus</span><select data-test-field="status" data-test-id="${esc(test.id)}">${selectOptions(TEST_STATUSES,result.status)}</select></label>
            <label><span class="field-label">Gerät</span><select data-test-field="device" data-test-id="${esc(test.id)}">${selectOptions(DEVICE_OPTIONS,result.device)}</select></label>
            <label><span class="field-label">Browser / App</span><select data-test-field="browser" data-test-id="${esc(test.id)}">${selectOptions(BROWSER_OPTIONS,result.browser)}</select></label>
            <label><span class="field-label">Umgebung</span><select data-test-field="environment" data-test-id="${esc(test.id)}">${selectOptions(ENV_OPTIONS,result.environment)}</select></label>
            <label><span class="field-label">Tatsächliches Ergebnis</span><textarea data-test-field="actualResult" data-test-id="${esc(test.id)}" placeholder="Was ist tatsächlich passiert?">${esc(result.actualResult)}</textarea></label>
            <label><span class="field-label">Private Testnotiz</span><textarea data-test-field="note" data-test-id="${esc(test.id)}" placeholder="Repro, Fehlermeldung, Beobachtung …">${esc(result.note)}</textarea></label>
            <label class="button button-secondary file-button">Screenshot anhängen<input type="file" accept="image/*" multiple data-screenshot-input="${esc(test.id)}"></label>
            ${['failed','partial','blocked'].includes(result.status) ? `<button class="button button-danger button-small" data-create-bug-from-test="${esc(test.id)}">Bug aus Test anlegen</button>` : ''}
            <p class="small">Letzter Test: ${esc(result.lastTestedAt ? compactDate(result.lastTestedAt) : 'noch nicht gesetzt')}</p>
          </div>
        </div>
      </article>`;
    }).join('') || emptyState('Keine passenden Tests gefunden.')}</div>`;
}

function renderBugs() {
  const bugs = combinedCollection('bugs').filter(item => matchesSearch(item.id,item.title,item.description,item.status,item.severity,item.relatedTestIds));
  return `${viewHeader('Bugs','Fehler getrennt von Tests und Batches. Lokal ergänzte Bugs bleiben im Browser und im Backup.',`<button class="button button-primary" data-open-dialog="bug">Bug anlegen</button>`) }
    <div class="stack">${bugs.map(bug => `<article class="card card-flat ${String(bug.severity).toLowerCase()==='kritisch'?'card-danger':''}">
      <div class="item-head"><div><div class="meta-row"><span class="badge">${esc(bug.id)}</span><span class="badge badge-danger">${esc(bug.severity || 'mittel')}</span></div><h3>${esc(bug.title)}</h3></div>${statusBadge(bug.status)}</div>
      <p>${esc(bug.description || '')}</p>
      ${bug.expected?`<div class="kv"><strong>Erwartet</strong><span>${esc(bug.expected)}</span></div>`:''}${bug.actual?`<div class="kv"><strong>Tatsächlich</strong><span>${esc(bug.actual)}</span></div>`:''}
      <div class="meta-row">${asArray(bug.relatedTestIds).map(id=>`<span class="badge">Test ${esc(id)}</span>`).join('')}${asArray(bug.relatedBatchIds).map(id=>`<span class="badge">Batch ${esc(id)}</span>`).join('')}</div>
      <div class="inline-actions" style="margin-top:10px"><select class="status-select" data-entity-status="bugs" data-entity-id="${esc(bug.id)}">${selectOptions([['offen','Offen'],['in-progress','In Bearbeitung'],['testing','Testing'],['blocked','Blockiert'],['behoben','Behoben'],['archived','Archiviert']],bug.status)}</select></div>
    </article>`).join('') || emptyState('Keine Bugs vorhanden.')}</div>`;
}

function renderIdeas() {
  const ideas = combinedCollection('ideas').filter(item => matchesSearch(item.id,item.title,item.description,item.status,item.priority));
  return `${viewHeader('Ideen','Ideen sind bewusst noch keine Aufgaben oder Batches. Eine Umsetzung benötigt eine explizite Entscheidung.',`<button class="button button-primary" data-open-dialog="idea">Idee erfassen</button>`) }
    <div class="stack">${ideas.map(idea => `<article class="card card-flat"><div class="item-head"><div><div class="meta-row">${priorityBadge(idea.priority)}<span class="badge">${esc(idea.id)}</span></div><h3>${esc(idea.title)}</h3></div>${statusBadge(idea.status)}</div><p>${esc(idea.description || '')}</p><div class="inline-actions"><select class="status-select" data-entity-status="ideas" data-entity-id="${esc(idea.id)}">${selectOptions([['neu','Neu'],['prüfen','Prüfen'],['später','Später'],['abgelehnt','Abgelehnt'],['umgewandelt','In Batch/Aufgabe umgewandelt'],['archived','Archiviert']],idea.status)}</select></div></article>`).join('') || emptyState('Keine Ideen vorhanden.')}</div>`;
}

function renderQuestions() {
  const questions = combinedCollection('questions').filter(item => matchesSearch(item.id,item.title,item.priority,item.status,item.answerOwner,item.impact,item.finalAnswer));
  return `${viewHeader('Offene Fragen','Fragen, Antwortverantwortung, Auswirkungen und finale Antworten nachvollziehbar halten.',`<button class="button button-primary" data-open-dialog="question">Frage anlegen</button>`) }
    <div class="stack">${questions.map(question => `<article class="card card-flat"><div class="item-head"><div><div class="meta-row">${priorityBadge(question.priority)}<span class="badge">${esc(question.id)}</span><span class="badge">Antwort: ${esc(question.answerOwner || 'offen')}</span></div><h3>${esc(question.title)}</h3></div>${statusBadge(question.status)}</div><p>${esc(question.impact || '')}</p><label><span class="field-label">Finale Antwort / Arbeitsstand (lokal)</span><textarea data-question-answer="${esc(question.id)}">${esc(question.finalAnswer || '')}</textarea></label><div class="inline-actions"><select class="status-select" data-entity-status="questions" data-entity-id="${esc(question.id)}">${selectOptions([['offen','Offen'],['in-review','In Klärung'],['answered','Beantwortet'],['blocked','Blockiert'],['archived','Archiviert']],question.status)}</select></div></article>`).join('') || emptyState('Keine offenen Fragen vorhanden.')}</div>`;
}

function renderDecisions() {
  const decisions = combinedCollection('decisions').filter(item => matchesSearch(item.id,item.title,item.reason,item.decision,item.impact,item.status));
  return `${viewHeader('Entscheidungslog','Wichtige Entscheidungen mit Grund, Alternativen, Auswirkungen und Ersetzungsstatus.',`<button class="button button-primary" data-open-dialog="decision">Entscheidung dokumentieren</button>`) }
    <div class="stack">${decisions.map(decision => `<article class="card card-flat"><div class="item-head"><div><div class="meta-row"><span class="badge">${esc(decision.id)}</span><span class="badge">${esc(decision.date || '')}</span></div><h3>${esc(decision.title)}</h3></div>${statusBadge(decision.status)}</div><div class="kv"><strong>Grund</strong><span>${esc(decision.reason || '—')}</span></div><div class="kv"><strong>Entscheidung</strong><span>${esc(decision.decision || '—')}</span></div><div class="kv"><strong>Auswirkung</strong><span>${esc(decision.impact || '—')}</span></div>${asArray(decision.alternatives).length?`<details class="details"><summary>Geprüfte Alternativen</summary>${listMarkup(decision.alternatives)}</details>`:''}<div class="inline-actions" style="margin-top:10px"><select class="status-select" data-entity-status="decisions" data-entity-id="${esc(decision.id)}">${selectOptions([['aktiv','Aktiv'],['superseded','Ersetzt'],['review','Review nötig'],['archived','Archiviert']],decision.status)}</select></div></article>`).join('') || emptyState('Keine Entscheidungen dokumentiert.')}</div>`;
}

function renderAiBatches() {
  const items = DATA.aiBatches.filter(item => matchesSearch(item.id,item.title,item.goal,item.status,item.repo,item.branch,item.inputFiles));
  return `${viewHeader('Claude-/Codex-Batches','Eingaben, Schutzregeln, Branches, erwartete Outputs und Status je KI-Arbeitspaket.')}
    <div class="stack">${items.map(item => `<article class="card card-flat"><div class="item-head"><div><div class="meta-row">${priorityBadge(item.priority)}<span class="badge">${esc(item.id)}</span></div><h3>${esc(item.title)}</h3></div>${statusBadge(item.status)}</div><p>${esc(item.goal || '')}</p><div class="kv"><strong>Repo</strong><span>${esc(item.repo || '—')}</span></div><div class="kv"><strong>Branch</strong><span><code>${esc(item.branch || '—')}</code></span></div><div class="kv"><strong>Erwarteter Output</strong><span>${esc(item.expectedOutput || '—')}</span></div>${asArray(item.inputFiles).length?`<details class="details"><summary>Eingabedateien</summary>${listMarkup(item.inputFiles)}</details>`:''}${asArray(item.doNotChange).length?`<details class="details"><summary>Nicht ändern</summary>${listMarkup(item.doNotChange)}</details>`:''}</article>`).join('') || emptyState('Keine KI-Batches gepflegt.')}</div>`;
}

function renderMasterchat() {
  const item = DATA.masterchat;
  return `${viewHeader('Masterchat','Aktueller übergreifender Projektstand, freigegebene Richtung und nächste Aktion.')}
    <section class="card"><div class="item-head"><div><p class="eyebrow">Stand ${esc(item.lastSummaryDate || 'unbekannt')}</p><h3>${esc(item.status || 'Kein Status gepflegt')}</h3></div><span class="badge">Masterchat</span></div><div class="kv"><strong>Nächste Aktion</strong><span>${esc(item.nextAction || '—')}</span></div><h4 style="margin-top:12px">Offene Masterchat-Punkte</h4>${listMarkup(item.openItems)}</section>`;
}

function renderSubchats() {
  const items = DATA.subchats.filter(item => matchesSearch(item.id,item.title,item.task,item.status,item.results,item.openItems));
  return `${viewHeader('Subchats','Spezialaufgaben mit Input, Output, Ergebnissen und Übergabe an den Masterchat.')}
    <div class="stack">${items.map(item => `<article class="card card-flat"><div class="item-head"><div><span class="badge">${esc(item.id)}</span><h3>${esc(item.title)}</h3></div>${statusBadge(item.status)}</div><p>${esc(item.task || '')}</p>${asArray(item.results).length?listMarkup(item.results):''}</article>`).join('') || emptyState('Im bereinigten Projektdatensatz sind noch keine Subchat-Einträge hinterlegt.')}</div>`;
}

function renderFiles() {
  const files = DATA.files.filter(item => matchesSearch(item.id,item.name,item.path,item.type,item.purpose,item.status));
  const backups = DATA.backups.filter(item => matchesSearch(item.id,item.projectState,item.topics,item.path));
  return `${viewHeader('Dateien & Backups','Verweise auf relevante Projektdateien und Backup-Stände. Private Dateien werden nicht in die öffentliche JSON übernommen.',`<button class="button button-primary" id="viewExportButton">Backup jetzt exportieren</button>`) }
    <div class="grid two"><section class="card card-flat"><div class="section-title"><h3>Dateien</h3><span class="badge">${files.length}</span></div>${files.map(file=>`<div class="list-item"><strong>${esc(file.name)}</strong><p class="small"><code>${esc(file.path || '')}</code></p><p>${esc(file.purpose || '')}</p><div class="meta-row"><span class="badge">${esc(file.type || '')}</span>${statusBadge(file.status)}</div></div>`).join('')||emptyState('Keine Dateien.')}</section><section class="card card-flat"><div class="section-title"><h3>Backups</h3><span class="badge">${backups.length}</span></div>${backups.map(backup=>`<div class="list-item"><strong>${esc(backup.id)}</strong><p>${esc(backup.projectState || '')}</p><p class="small">${esc(backup.date || '')} · ${esc(backup.path || '')}</p>${listMarkup(backup.topics)}</div>`).join('')||emptyState('Keine Backups dokumentiert.')}</section></div>`;
}

function renderGithub() {
  const repos = asArray(DATA.github.repositories).filter(repo => matchesSearch(repo.id,repo.name,repo.role,repo.warning));
  return `${viewHeader('GitHub / PR','Repository-Rollen, Branch-Hinweise und Risiken. Die Webapp führt keine GitHub-Schreibaktionen aus.')}
    <div class="stack">${repos.map(repo=>`<article class="card card-flat"><div class="item-head"><div><span class="badge">${esc(repo.visibility || 'Sichtbarkeit offen')}</span><h3>${esc(repo.name)}</h3></div><span class="badge badge-warning">nicht blind mergen</span></div><p>${esc(repo.role || '')}</p><div class="kv"><strong>Default Branch</strong><span><code>${esc(repo.defaultBranch || 'nicht gepflegt')}</code></span></div><div class="card card-warning" style="margin-top:10px"><strong>Hinweis</strong><p>${esc(repo.warning || 'Änderungen nur über getrennte, geprüfte Branches und Batches.')}</p></div></article>`).join('')||emptyState('Keine Repositories gepflegt.')}</div>`;
}

function combinedTimeline() {
  return [...asArray(LOCAL.timeline), ...asArray(DATA.timeline)].sort((a,b) => String(b.date || '').localeCompare(String(a.date || '')));
}
function renderTimeline() {
  const items = combinedTimeline().filter(item => matchesSearch(item.id,item.title,item.description,item.type,item.date));
  return `${viewHeader('Timeline','Chronologischer Verlauf aus bereinigten Projektmeilensteinen und lokalen Änderungen.')}
    <div class="timeline">${items.map(item=>`<article class="timeline-item"><div class="item-head"><div><span class="badge">${esc(item.type || 'Ereignis')}</span><h3>${esc(item.title)}</h3></div><span class="small">${compactDate(item.date)}</span></div><p>${esc(item.description || '')}</p></article>`).join('')||emptyState('Keine Timeline-Einträge.')}</div>`;
}

function renderRisks() {
  const items = DATA.risks.filter(item => matchesSearch(item.id,item.title,item.severity,item.probability,item.impact,item.status,item.mitigation,item.owner));
  return `${viewHeader('Risiken & Blocker','Schweregrad, Wahrscheinlichkeit, Auswirkung, Gegenmaßnahme und Verantwortlichkeit.')}
    <div class="stack">${items.map(item=>`<article class="card card-flat ${String(item.severity).toLowerCase()==='kritisch'?'card-danger':''}"><div class="item-head"><div><div class="meta-row"><span class="badge">${esc(item.id)}</span><span class="badge badge-danger">${esc(item.severity)}</span><span class="badge">Wahrscheinlichkeit: ${esc(item.probability)}</span></div><h3>${esc(item.title)}</h3></div>${statusBadge(item.status)}</div><div class="kv"><strong>Auswirkung</strong><span>${esc(item.impact || '—')}</span></div><div class="kv"><strong>Gegenmaßnahme</strong><span>${esc(item.mitigation || '—')}</span></div><div class="kv"><strong>Verantwortlich</strong><span>${esc(item.owner || '—')}</span></div></article>`).join('')||emptyState('Keine Risiken gepflegt.')}</div>`;
}

function renderNotes() {
  const notes = LOCAL.quickNotes.filter(item => !item.archived && matchesSearch(item.id,item.text,item.type,item.createdAt));
  return `${viewHeader('Schnellnotizen','Private lokale Erfassung. Notizen können als Idee, Frage oder Mika-Aufgabe angelegt werden.',`<button class="button button-primary" id="newQuickNoteButton">Notiz speichern</button>`) }
    <section class="card"><div class="form-grid"><div class="full"><label><span class="field-label">Neue Schnellnotiz</span><textarea id="quickNoteText" placeholder="Kurze Beobachtung oder nächste Aktion …"></textarea></label></div><div><label><span class="field-label">Typ</span><select id="quickNoteType"><option value="note">Notiz</option><option value="idea">Idee</option><option value="question">Frage</option><option value="task">Mika-Aufgabe</option></select></label></div></div></section>
    <section class="card"><div class="section-title"><h3>Lokale Notizen</h3><span class="badge">${notes.length}</span></div><div class="stack">${notes.map(note=>`<div class="list-item"><div class="item-head"><div><span class="badge">${esc(note.type)}</span><strong>${esc(note.text)}</strong></div><button class="button button-small button-ghost" data-archive-note="${esc(note.id)}">Archivieren</button></div><p class="small">${compactDate(note.createdAt)}</p></div>`).join('')||emptyState('Noch keine Schnellnotizen.')}</div></section>
    <section class="card card-warning"><div class="section-title"><h3>Allgemeine Legacy-Notizen</h3><span class="badge badge-warning">privat · nur lokal</span></div><p>Dieses Feld bewahrt den Inhalt alter Backups. Es wird nie in project-data.json geschrieben.</p><textarea id="legacyNotes" placeholder="Importierte oder persönliche Projektnotizen …">${esc(LOCAL.legacyGeneralNotes)}</textarea></section>`;
}

function renderData() {
  const unknownTodo = Object.keys(LOCAL.unmappedLegacyItems.todoState || {});
  const unknownTests = Object.keys(LOCAL.unmappedLegacyItems.testState || {});
  const shotCountText = '<span id="screenshotCount">wird ermittelt …</span>';
  return `${viewHeader('Daten & Validierung','Transparenz über Quellen, Schemafehler, lokale Speicherung, unbekannte Legacy-IDs und Imports.')}
    <div class="grid two">
      <section class="card card-flat ${VALIDATION.errors.length?'card-danger':VALIDATION.warnings.length?'card-warning':'card-success'}"><div class="section-title"><h3>JSON-Validierung</h3>${VALIDATION.errors.length?statusBadge(`${VALIDATION.errors.length} Fehler`):VALIDATION.warnings.length?statusBadge(`${VALIDATION.warnings.length} Hinweise`):'<span class="badge badge-success">Valide</span>'}</div>${VALIDATION.errors.length?`<strong>Fehler</strong><ul class="validation-list">${VALIDATION.errors.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}${VALIDATION.warnings.length?`<strong>Hinweise</strong><ul class="validation-list">${VALIDATION.warnings.slice(0,30).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}</section>
      <section class="card card-flat"><h3>Datenquellen</h3><div class="kv"><strong>Projektstruktur</strong><span>${esc(DATA.sourceInfo.projectData)}</span></div><div class="kv"><strong>Legacy-Batches/Tests</strong><span>${esc(DATA.sourceInfo.legacyData)}</span></div><div class="kv"><strong>Lokales Schema</strong><span><code>${esc(LOCAL.schemaVersion)}</code></span></div><div class="kv"><strong>Screenshots</strong><span>${shotCountText}</span></div></section>
      <section class="card card-flat"><h3>Unbekannte Legacy-IDs</h3><p>Sie werden nicht verworfen und bleiben im Export erhalten.</p><div class="kv"><strong>Todo-/Task-IDs</strong><span>${unknownTodo.length}</span></div><div class="kv"><strong>Test-IDs</strong><span>${unknownTests.length}</span></div>${unknownTodo.length?`<details class="details"><summary>Todo-IDs anzeigen</summary><code>${esc(unknownTodo.join(', '))}</code></details>`:''}${unknownTests.length?`<details class="details"><summary>Test-IDs anzeigen</summary><code>${esc(unknownTests.join(', '))}</code></details>`:''}</section>
      <section class="card card-flat"><h3>Importhistorie</h3>${LOCAL.importHistory.slice(0,8).map(item=>`<div class="list-item"><strong>${esc(item.schema || 'unbekanntes Schema')}</strong><p class="small">${compactDate(item.importedAt)} · ${esc(item.fileName || '')}</p><p>${esc(item.summary || '')}</p></div>`).join('')||emptyState('Noch kein Backup importiert.')}</section>
    </div>
    <section class="card card-danger" style="margin-top:14px"><h3>Status zurücksetzen</h3><p>Setzt nur lokale Task- und Teststatus zurück. Notizen, Mika-Aufgaben und Screenshots bleiben erhalten. Vorher Backup exportieren.</p><button class="button button-danger" id="resetStatusesButton">Task-/Teststatus zurücksetzen</button></section>`;
}

function renderCurrentView() {
  const views = {
    dashboard: renderDashboard,
    scope: renderScope,
    phases: renderPhases,
    batches: renderBatches,
    mikaTasks: renderMikaTasks,
    tests: renderTests,
    bugs: renderBugs,
    ideas: renderIdeas,
    questions: renderQuestions,
    decisions: renderDecisions,
    aiBatches: renderAiBatches,
    masterchat: renderMasterchat,
    subchats: renderSubchats,
    files: renderFiles,
    github: renderGithub,
    timeline: renderTimeline,
    risks: renderRisks,
    notes: renderNotes,
    data: renderData
  };
  const renderer = views[LOCAL.ui.activeView] || views.dashboard;
  $('#viewRoot').innerHTML = renderer();
  bindViewEvents();
}

function renderApp() {
  if (!DATA || !LOCAL) return;
  $('#loadingState').classList.add('hidden');
  $('#errorState').classList.add('hidden');
  $('#projectTitle').textContent = DATA.project.name || 'KI-Projektmanagement';
  $('#projectSubtitle').textContent = `${DATA.project.description || ''} · persönliche Daten nur lokal`;
  $('#validationBadge').textContent = VALIDATION.errors.length ? `${VALIDATION.errors.length} Datenfehler` : VALIDATION.warnings.length ? `${VALIDATION.warnings.length} Datenhinweise` : 'JSON valide';
  $('#validationBadge').className = `badge ${VALIDATION.errors.length ? 'badge-danger' : VALIDATION.warnings.length ? 'badge-warning' : 'badge-success'}`;
  $('#globalSearch').value = LOCAL.ui.search || '';
  $('#mobileSearch').value = LOCAL.ui.search || '';
  renderNavigation();
  renderCurrentView();
}

function bindViewEvents() {
  $$('[data-nav-jump]').forEach(button => button.addEventListener('click',()=>navigate(button.dataset.navJump)));
  $$('[data-open-dialog]').forEach(button => button.addEventListener('click',()=>openEntryDialog(button.dataset.openDialog)));

  $('#showArchivedBatches')?.addEventListener('change', event => { LOCAL.ui.showArchived = event.target.checked; saveLocal({render:true}); });
  $('#showArchivedMika')?.addEventListener('change', event => { LOCAL.ui.showArchived = event.target.checked; saveLocal({render:true}); });

  $$('[data-task-id]').forEach(input => input.addEventListener('change', event => {
    const id = event.target.dataset.taskId;
    LOCAL.batchTaskState[id] = { status: event.target.checked ? 'done' : 'open', updatedAt: nowIso() };
    saveLocal({render:true, timeline:{title:`Batch-Task ${id} ${event.target.checked?'abgeschlossen':'wieder geöffnet'}`,description:'Lokaler Status wurde aktualisiert.',type:'Batch'}});
  }));

  $$('[data-mika-status]').forEach(select => select.addEventListener('change', event => {
    const task = LOCAL.mikaTasks.find(item => item.id === event.target.dataset.mikaStatus);
    if (task) { task.status = event.target.value; task.updatedAt = nowIso(); saveLocal({render:true,timeline:{title:`Mika-Aufgabe ${task.id}: ${task.status}`,description:task.title,type:'Mika-Aufgabe'}}); }
  }));

  $$('[data-test-field]').forEach(field => {
    const eventName = field.tagName === 'TEXTAREA' ? 'change' : 'change';
    field.addEventListener(eventName, event => updateTestResult(event.target.dataset.testId,event.target.dataset.testField,event.target.value));
  });
  $$('[data-screenshot-input]').forEach(input => input.addEventListener('change', handleScreenshotInput));
  $$('[data-create-bug-from-test]').forEach(button => button.addEventListener('click',()=>openEntryDialog('bug',{testId:button.dataset.createBugFromTest})));
  renderAllScreenshotGrids();

  $$('[data-entity-status]').forEach(select => select.addEventListener('change', event => {
    const collection = event.target.dataset.entityStatus;
    const id = event.target.dataset.entityId;
    LOCAL.entityOverrides[collection] ||= {};
    LOCAL.entityOverrides[collection][id] = { ...asObject(LOCAL.entityOverrides[collection][id]), status:event.target.value, updatedAt:nowIso() };
    saveLocal({render:true,timeline:{title:`${collection} ${id}: Status geändert`,description:`Neuer Status: ${event.target.value}`,type:'Status'}});
  }));

  $$('[data-question-answer]').forEach(area => area.addEventListener('change', event => {
    const id = event.target.dataset.questionAnswer;
    LOCAL.entityOverrides.questions[id] = { ...asObject(LOCAL.entityOverrides.questions[id]), finalAnswer:event.target.value, updatedAt:nowIso() };
    saveLocal({timeline:{title:`Antwort zu ${id} aktualisiert`,description:'Lokale Antwort gespeichert.',type:'Frage'}});
  }));

  $('#saveDashboardQuickNote')?.addEventListener('click',()=>saveQuickNote($('#dashboardQuickNote').value,$('#dashboardQuickNoteType').value));
  $('#newQuickNoteButton')?.addEventListener('click',()=>saveQuickNote($('#quickNoteText').value,$('#quickNoteType').value));
  $$('[data-archive-note]').forEach(button => button.addEventListener('click',()=>{
    const note = LOCAL.quickNotes.find(item=>item.id===button.dataset.archiveNote);
    if (note) { note.archived = true; note.text = note.text; saveLocal({render:true}); }
  }));
  $('#legacyNotes')?.addEventListener('change',event=>{LOCAL.legacyGeneralNotes=event.target.value;saveLocal({timeline:{title:'Allgemeine Legacy-Notizen aktualisiert',description:'Der private lokale Notizstand wurde gespeichert.',type:'Notiz'}});});
  $('#viewExportButton')?.addEventListener('click',exportBackup);
  $('#resetStatusesButton')?.addEventListener('click',resetStatuses);
  if (LOCAL.ui.activeView === 'data') dbAll().then(items=>{const el=$('#screenshotCount');if(el)el.textContent=String(items.length);}).catch(()=>{});
}
