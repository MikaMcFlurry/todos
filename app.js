'use strict';

function updateTestResult(id, field, value) {
  const result = testResult(id);
  result[field] = value;
  result.updatedAt = nowIso();
  if (field === 'status' && value !== 'untested') result.lastTestedAt = nowIso();
  LOCAL.testResults[id] = result;
  saveLocal({
    render: field === 'status',
    timeline: field === 'status'
      ? {title:`Test ${id}: ${value}`,description:'Strukturierter Teststatus aktualisiert.',type:'test',targetView:'quality'}
      : null
  });
}

function saveQuickNote(text, type) {
  const clean = String(text || '').trim();
  if (!clean) return showToast('Bitte zuerst einen Inhalt eingeben.','danger');
  const createdAt = nowIso();
  if (type === 'task') {
    LOCAL.mikaTasks.unshift({id:uniqueId('mika-task'),title:clean,description:'Aus Schnellnotiz erstellt.',category:'Schnellnotiz',priority:'P2',status:'open',createdAt,updatedAt:createdAt});
  } else if (type === 'idea') {
    LOCAL.ideas.unshift({id:uniqueId('idea-local'),title:clean,description:'Aus Schnellnotiz erstellt.',priority:'P2',status:'neu',createdAt});
  } else if (type === 'question') {
    LOCAL.questions.unshift({id:uniqueId('question-local'),title:clean,priority:'P2',status:'offen',answerOwner:'Mika',impact:'Aus Schnellnotiz erstellt.',createdAt});
  } else {
    LOCAL.quickNotes.unshift({id:uniqueId('note-local'),text:clean,type:'note',createdAt,archived:false});
  }
  addTimeline({title:'Schnellnotiz gespeichert',description:clean,type,targetView:type==='task'?'work':type==='note'?'data':'knowledge'},false);
  saveLocal({render:true});
  showToast('Lokal gespeichert.','success');
}

function openEntryDialog(type, context = {}) {
  if (!DATA || !LOCAL) return showToast('Bitte zuerst ein Projekt öffnen.','danger');
  const chatOptions = flattenProjectChats(DATA).map(chat => [chat.id,`${chat.modelName}: ${chat.name}`]);
  const definitions = {
    mikaTask: {
      title:'Mika-Aufgabe anlegen',
      eyebrow:'Persönliche Aufgabe · nur lokal',
      fields:[
        ['title','Titel','text',true,context.title||''],
        ['description','Beschreibung','textarea',false,context.description||''],
        ['category','Kategorie','text',false,'Allgemein'],
        ['priority','Priorität','select',false,'P2',[['P0','P0 kritisch'],['P1','P1 wichtig'],['P2','P2 normal'],['P3','P3 später']]],
        ['dueDate','Fälligkeitsdatum','date',false,''],
        ['projectRef','Projektbezug','text',false,DATA.id]
      ]
    },
    bug: {
      title:'Bug anlegen',
      eyebrow:'Fehler · nur lokal',
      fields:[
        ['title','Titel','text',true,context.testId?`Fehler aus Test ${context.testId}`:''],
        ['description','Beschreibung / Repro','textarea',true,''],
        ['severity','Schweregrad','select',false,'mittel',[['kritisch','Kritisch'],['hoch','Hoch'],['mittel','Mittel'],['niedrig','Niedrig']]],
        ['status','Status','select',false,'offen',[['offen','Offen'],['in-progress','In Bearbeitung'],['blocked','Blockiert']]],
        ['relatedTestId','Verknüpfter Test','text',false,context.testId||''],
        ['expected','Erwartet','textarea',false,''],
        ['actual','Tatsächlich','textarea',false,'']
      ]
    },
    question: {
      title:'Offene Frage anlegen',
      eyebrow:'Frage · nur lokal',
      fields:[
        ['title','Frage','textarea',true,''],
        ['priority','Priorität','select',false,'P1',[['P0','P0 kritisch'],['P1','P1 wichtig'],['P2','P2 normal'],['P3','P3 später']]],
        ['answerOwner','Wer muss antworten?','text',false,'Mika'],
        ['impact','Auswirkung / warum wichtig','textarea',false,'']
      ]
    },
    decision: {
      title:'Entscheidung dokumentieren',
      eyebrow:'Entscheidungslog · nur lokal',
      fields:[
        ['title','Titel','text',true,''],
        ['reason','Grund','textarea',true,''],
        ['alternatives','Geprüfte Alternativen (eine pro Zeile)','textarea',false,''],
        ['decision','Finale Entscheidung','textarea',true,''],
        ['impact','Auswirkungen','textarea',false,'']
      ]
    },
    idea: {
      title:'Idee erfassen',
      eyebrow:'Noch keine Aufgabe · nur lokal',
      fields:[
        ['title','Titel','text',true,''],
        ['description','Beschreibung','textarea',false,''],
        ['priority','Priorität','select',false,'P2',[['P1','P1 wichtig'],['P2','P2 normal'],['P3','P3 später']]]
      ]
    },
    backup: {
      title:'Backup-Eintrag dokumentieren',
      eyebrow:'Manuell / ChatGPT-unterstützt',
      fields:[
        ['title','Bezeichnung','text',true,''],
        ['chatId','Zugehöriger Chat','select',false,context.chatId||'',[['','Kein Chat'],...chatOptions]],
        ['date','Datum','date',true,today()],
        ['type','Typ','select',false,'chat-backup',[['chat-backup','Chat-Backup'],['project-state','Projektstatus'],['handoff','Handoff'],['archive','Archiv']]],
        ['reference','Datei / Referenz','text',false,''],
        ['summary','Kurze öffentliche Beschreibung','textarea',false,'']
      ]
    }
  };
  const definition = definitions[type];
  if (!definition) return;
  currentDialog = {type,context};
  $('#dialogEyebrow').textContent = definition.eyebrow;
  $('#dialogTitle').textContent = definition.title;
  $('#dialogFields').innerHTML = definition.fields.map(([name,label,kind,required,value,options]) => {
    const attrs = `name="${esc(name)}" ${required?'required':''}`;
    let input;
    if (kind === 'textarea') input = `<textarea ${attrs}>${esc(value)}</textarea>`;
    else if (kind === 'select') input = `<select ${attrs}>${selectOptions(options||[],value)}</select>`;
    else input = `<input type="${kind}" ${attrs} value="${esc(value)}">`;
    return `<label class="${kind==='textarea'?'full':''}"><span class="field-label">${esc(label)}${required?' *':''}</span>${input}</label>`;
  }).join('');
  $('#entryDialog').showModal();
}

function handleDialogSubmit(event) {
  event.preventDefault();
  if (!currentDialog) return;
  const values = Object.fromEntries(new FormData(event.currentTarget).entries());
  const createdAt = nowIso();
  if (currentDialog.type === 'mikaTask') LOCAL.mikaTasks.unshift({id:uniqueId('mika-task'),...values,status:'open',createdAt,updatedAt:createdAt});
  else if (currentDialog.type === 'bug') LOCAL.bugs.unshift({id:uniqueId('bug-local'),...values,relatedTestIds:values.relatedTestId?[values.relatedTestId]:[],relatedBatchIds:[],createdAt});
  else if (currentDialog.type === 'question') LOCAL.questions.unshift({id:uniqueId('question-local'),...values,status:'offen',createdAt});
  else if (currentDialog.type === 'decision') LOCAL.decisions.unshift({id:uniqueId('decision-local'),...values,alternatives:String(values.alternatives||'').split('\n').map(item=>item.trim()).filter(Boolean),date:today(),status:'aktiv',createdAt});
  else if (currentDialog.type === 'idea') LOCAL.ideas.unshift({id:uniqueId('idea-local'),...values,status:'neu',createdAt});
  else if (currentDialog.type === 'backup') {
    const backup = {id:uniqueId('backup-local'),date:values.date,type:values.type,status:'tracked',chatId:values.chatId||null,title:values.title,projectState:values.summary||values.title,path:values.reference||'lokal dokumentiert',createdAt};
    LOCAL.backups.unshift(backup);
    if (values.chatId) LOCAL.chatOverrides[values.chatId] = {...asObject(LOCAL.chatOverrides[values.chatId]),backupStatus:'current',lastBackupAt:values.date,latestBackupRef:values.reference||backup.id,updatedAt:createdAt};
  }
  addTimeline({title:`${currentDialog.type} lokal angelegt`,description:values.title||values.summary||'',type:currentDialog.type,targetView:currentDialog.type==='backup'?'files':currentDialog.type==='bug'?'quality':currentDialog.type==='mikaTask'?'work':'knowledge'},false);
  saveLocal({render:true});
  $('#entryDialog').close();
  currentDialog = null;
  showToast('Eintrag lokal gespeichert.','success');
}

function updateChatBackupStatus(chatId, status) {
  LOCAL.chatOverrides[chatId] = {...asObject(LOCAL.chatOverrides[chatId]),backupStatus:status,updatedAt:nowIso()};
  saveLocal({render:true,timeline:{title:`Chat-Backupstatus ${chatId}: ${status}`,description:'Lokaler Backup-Status aktualisiert.',type:'backup',targetView:'ai'}});
}

function recordChatBackup(chatId) {
  const chat = flattenProjectChats(DATA).find(item=>item.id===chatId);
  if (!chat) return;
  LOCAL.chatOverrides[chatId] = {...asObject(LOCAL.chatOverrides[chatId]),backupStatus:'current',lastBackupAt:today(),latestBackupRef:`manual-${today()}`,updatedAt:nowIso()};
  LOCAL.backups.unshift({id:uniqueId('backup-local'),date:today(),type:'chat-backup',status:'tracked',chatId,title:`Backup ${chat.name}`,projectState:`Manuell dokumentierter Backup-Status für ${chat.name}`,path:'Referenz noch nicht hinterlegt',createdAt:nowIso()});
  saveLocal({render:true,timeline:{title:`Chat-Backup dokumentiert: ${chat.name}`,description:'Status wurde manuell als aktuell markiert. Kein automatischer Chat-Inhalt wurde eingelesen.',type:'backup',targetView:'ai'}});
  showToast('Backup-Status dokumentiert. Inhalt wurde nicht automatisch erfasst.','success');
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
async function dbAll(){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(DB_STORE,'readonly'),request=tx.objectStore(DB_STORE).getAll();request.onsuccess=()=>resolve(request.result||[]);request.onerror=()=>reject(request.error)})}
async function dbPut(item){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(DB_STORE,'readwrite'),request=tx.objectStore(DB_STORE).put(item);request.onsuccess=()=>resolve();request.onerror=()=>reject(request.error)})}
async function dbDelete(id){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(DB_STORE,'readwrite'),request=tx.objectStore(DB_STORE).delete(id);request.onsuccess=()=>resolve();request.onerror=()=>reject(request.error)})}
function screenshotProjectId(item){return item.projectId||FINANCE_PROJECT_ID}
async function dbAllForProject(projectId){return(await dbAll()).filter(item=>screenshotProjectId(item)===projectId)}
