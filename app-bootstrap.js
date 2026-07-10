'use strict';

(() => {
  const fallbackProject = ({id,name,shortName,description,statusLabel,phase,progress,nextAction,warning}) => ({
    id,
    legacyProjectIds:id==='project-finanztracker'?['finanztracker-tool']:[],
    name,
    shortName,
    description,
    status:'active',
    statusLabel,
    phase,
    workflowPhaseId:'workflow-phase-6',
    progress,
    lastUpdated:'2026-07-10',
    lastBackupAt:null,
    nextAction,
    warning,
    visibility:'private_repo_recommended',
    goals:{goal:description,problem:'Projektdateien konnten beim Start noch nicht vollständig geladen werden.',targetGroup:'Mika',successCriteria:[],nonGoals:[],constraints:['Fallback-Daten enthalten keine privaten Inhalte.']},
    phases:[],gates:[],batches:[],mikaTasks:[],tests:[],bugs:[],ideas:[],questions:[],decisions:[],aiModels:[],files:[],backups:[],handoffs:[],github:{},timeline:[],risks:[],notes:[],
    workflowState:{currentLifecyclePhaseId:'workflow-phase-6',gateStatuses:{},repositoryChecklist:[],workflowFiles:[],routingOverrides:[]},
    source:'safe-startup-fallback'
  });

  window.PM_BOOTSTRAP_WORKSPACE = {
    schema:'mika-ai-project-management-tool-v1.1',
    updatedAt:'2026-07-10',
    global:{
      toolName:'KI-Projektmanagement',
      description:'Sichere lokale Startübersicht.',
      privacyMode:'private_repo_recommended',
      currentRepositoryVisibility:'public',
      privacyNotice:'Fallback aktiv: Es werden ausschließlich bereinigte Projektmetadaten angezeigt.',
      backupPolicy:{mode:'manual_or_chatgpt_assisted',automaticChatIngestion:false,messageReminderThreshold:15,backupTriggers:[],overdueRule:''},
      repositoryPolicy:{recommendedMode:'private',safeToCommit:['Bereinigte Projektmetadaten'],localOrPrivateOnly:['Notizen','Screenshots','Chat-Backups','Finanzdaten','Zugangsdaten']}
    },
    workflowTemplates:{roles:[],lifecyclePhases:[],gates:[],workflowChain:[],handoffTypes:[],repositoryChecklist:[],workflowFiles:[],modelRoutingRules:[]},
    projects:[
      fallbackProject({id:'project-finanztracker',name:'Buchhaltungs Tool / Finanz Tracker',shortName:'Finanztracker',description:'Finanztracker-Projektcockpit und Legacy-Testdaten.',statusLabel:'Fallback – Projektdaten werden später erneut geladen',phase:'Private Beta / Implementierung',progress:70,nextAction:'Projektdateien neu laden, sobald die Verbindung stabil ist.',warning:'Sichere Startdaten aktiv; Detaildaten sind möglicherweise noch nicht geladen.'}),
      fallbackProject({id:'project-management-tool',name:'Projektmanagement Tool',shortName:'PM Tool',description:'Zentrales Cockpit für standardisierte KI-Projektworkflows.',statusLabel:'Fallback – Projektdaten werden später erneut geladen',phase:'V1.1 Follow-up',progress:65,nextAction:'Startproblem prüfen und Detaildaten erneut laden.',warning:'Sichere Startdaten aktiv; Detaildaten sind möglicherweise noch nicht geladen.'})
    ],
    legacySources:{v1ProjectDataSchema:'project-management-tool-v1',legacyTodoFile:'todo-data.json',legacyBackupSchemas:['finanztracker-todo-tool-v2','ai-project-management-tool-v1'],financeProjectId:'project-finanztracker'},
    projectFiles:[]
  };

  let watchdog = null;
  let lastError = '';
  window.__PM_APP_READY__ = false;

  const errorText = error => {
    if (!error) return 'Unbekannter Startfehler';
    if (typeof error === 'string') return error;
    return error.message || String(error);
  };

  const renderStartupFailure = message => {
    if (window.__PM_APP_READY__) return;
    const title = document.getElementById('appTitle');
    const loading = document.getElementById('loadingState');
    const error = document.getElementById('errorState');
    if (title) title.textContent = 'App konnte nicht vollständig starten';
    if (loading) loading.classList.add('hidden');
    if (!error) return;
    error.classList.remove('hidden');
    error.innerHTML = `
      <strong>Der Start wurde abgebrochen, statt endlos weiterzuladen.</strong>
      <p>${String(message || lastError || 'Projektdateien oder App-Skripte konnten nicht rechtzeitig geladen werden.').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]))}</p>
      <div class="inline-actions">
        <button class="button button-primary" type="button" onclick="location.reload()">Neu laden</button>
        <button class="button button-secondary" type="button" onclick="window.__pmResetAppCache()">App-Cache zurücksetzen</button>
      </div>
      <p class="small">Das Zurücksetzen entfernt nur den Offline-App-Cache und Service Worker. Lokale Projektstände in localStorage und IndexedDB bleiben erhalten.</p>`;
  };

  window.__pmMarkReady = () => {
    window.__PM_APP_READY__ = true;
    if (watchdog) clearTimeout(watchdog);
  };

  window.__pmResetAppCache = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(registration=>registration.unregister()));
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.filter(key=>key.includes('mika-ai-project-management')).map(key=>caches.delete(key)));
      }
    } finally {
      location.reload();
    }
  };

  window.addEventListener('error', event => {
    const failedAsset = event.target?.src || event.target?.href || '';
    lastError = errorText(event.error || event.message || (failedAsset?`Ressource konnte nicht geladen werden: ${failedAsset}`:'Unbekannter Ressourcenfehler'));
    setTimeout(()=>renderStartupFailure(`Startfehler: ${lastError}`),0);
  },true);

  window.addEventListener('unhandledrejection', event => {
    lastError = errorText(event.reason);
    setTimeout(()=>renderStartupFailure(`Nicht behandelter Startfehler: ${lastError}`),0);
  });

  watchdog = setTimeout(()=>renderStartupFailure(lastError || 'Der Start dauerte länger als 12 Sekunden. Wahrscheinlich hängt ein Datenabruf, eine App-Datei oder ein veralteter Offline-Cache.'),12000);
})();
