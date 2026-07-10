import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(import.meta.dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const bytes = file => fs.readFileSync(path.join(root, file));
const exists = file => fs.existsSync(path.join(root, file));
const fail = message => { throw new Error(message); };
const gitBlobSha = file => {
  const body = bytes(file);
  return crypto.createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${body.length}\0`), body])).digest('hex');
};

const registry = JSON.parse(read('project-data.json'));
if (registry.schema !== 'mika-ai-project-management-tool-v1.1') fail('Unexpected workspace schema.');
if (!Array.isArray(registry.projectFiles) || registry.projectFiles.length < 2) fail('At least two project files are required.');

const projects = registry.projectFiles.map(ref => {
  if (!exists(ref.path)) fail(`Missing project file: ${ref.path}`);
  return JSON.parse(read(ref.path));
});
const ids = projects.map(project => project.id);
if (new Set(ids).size !== ids.length) fail('Duplicate project ID.');
if (!ids.includes('project-finanztracker') || !ids.includes('project-management-tool')) fail('Required initial projects are missing.');

const html = read('index.html');
const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(match => match[1]).filter(ref => !ref.startsWith('http'));
const missingRefs = refs.filter(ref => !exists(ref));
if (missingRefs.length) fail(`Missing HTML assets: ${missingRefs.join(', ')}`);
for (const requiredId of ['projectCommandBar','projectQuickSwitch','projectCommandNav','projectCommandSearch','projectDesktopMoreButton']) {
  if (!html.includes(`id="${requiredId}"`)) fail(`Missing compact cockpit element: ${requiredId}`);
}
const htmlIds = [...html.matchAll(/id="([^"]+)"/g)].map(match => match[1]);
const duplicateHtmlIds = htmlIds.filter((id,index) => htmlIds.indexOf(id) !== index);
if (duplicateHtmlIds.length) fail(`Duplicate HTML IDs: ${[...new Set(duplicateHtmlIds)].join(', ')}`);

const serviceWorker = read('service-worker.js');
const cachedAssets = [...serviceWorker.matchAll(/'\.\/([^']*)'/g)].map(match => match[1]).filter(Boolean);
const missingCacheAssets = cachedAssets.filter(ref => !exists(ref));
if (missingCacheAssets.length) fail(`Missing service-worker assets: ${missingCacheAssets.join(', ')}`);
for (const requiredAsset of ['styles-v1-1-polish.css','app-v1-1-polish.js']) {
  if (!cachedAssets.includes(requiredAsset)) fail(`Follow-up asset missing from service worker: ${requiredAsset}`);
}

const publicFiles = ['project-data.json', ...registry.projectFiles.map(ref => ref.path)];
const publicText = publicFiles.map(read).join('\n');
for (const [name, pattern] of [
  ['embedded image', /data:image\//i],
  ['raw screenshots collection', /"screenshots"\s*:/i],
  ['legacy test state', /"testState"\s*:/i],
  ['general private notes', /"generalNotes"\s*:/i],
  ['raw chat transcript', /"(?:rawChat|conversationTranscript|fullConversation)"\s*:/i],
  ['probable secret value', /(api[_-]?key|access[_-]?token|secret)["']?\s*[:=]\s*["'][^"']{8,}/i]
]) {
  if (pattern.test(publicText)) fail(`Public-data scan found ${name}.`);
}

const workflow = registry.workflowTemplates || {};
if ((workflow.lifecyclePhases || []).length !== 11) fail('Expected workflow phases 0–10.');
if ((workflow.gates || []).length !== 6) fail('Expected six workflow gates.');
if ((workflow.workflowFiles || []).length !== 15) fail('Expected 15 reusable workflow files.');
if ((workflow.workflowChain || []).length < 7) fail('Expected complete AI workflow chain.');
if ((workflow.handoffTypes || []).length < 4) fail('Expected handoff type definitions.');
if ((workflow.gates || []).some(gate => !Array.isArray(gate.checklist) || gate.checklist.length < 2)) fail('Every workflow gate needs at least two checklist items.');

const modelsRequired = ['ChatGPT','Claude','Gemini','Suno'];
for (const project of projects) {
  const modelNames = (project.aiModels || []).map(model => model.name).join(' ');
  for (const model of modelsRequired) if (!modelNames.toLowerCase().includes(model.toLowerCase())) fail(`${project.id}: missing AI model ${model}.`);
}

const polishJs = read('app-v1-1-polish.js');
for (const requiredMarker of ['validateImportScope','mergeImportedProjectMetadata','renderProjectNavigationV11','renderWorkflowV11','renderFilesV11']) {
  if (!polishJs.includes(requiredMarker)) fail(`Missing follow-up logic marker: ${requiredMarker}`);
}
if (!polishJs.includes("requestedScope === 'project' && payloadScope === 'global'")) fail('Project import does not visibly reject global backups.');
if (!polishJs.includes("requestedScope === 'global' && payloadScope === 'project'")) fail('Global import does not visibly reject project backups.');

const polishCss = read('styles-v1-1-polish.css');
for (const requiredMarker of ['project-command-bar','body.project-open .project-sidebar','project-workflow-chain','gate-checklist-ui']) {
  if (!polishCss.includes(requiredMarker)) fail(`Missing follow-up style marker: ${requiredMarker}`);
}
if (!/body\.project-open \.project-sidebar\{display:none!important\}/.test(polishCss)) fail('Permanent desktop project sidebar is not disabled.');

const todoBlobSha = gitBlobSha('todo-data.json');
const expectedTodoBlobSha = 'c4bda99be81720ecaf433c5bbbe2280f7fa79673';
if (todoBlobSha !== expectedTodoBlobSha) fail(`todo-data.json changed: ${todoBlobSha}`);

console.log(JSON.stringify({
  schema: registry.schema,
  projects: ids,
  htmlAssets: refs.length,
  htmlIds: htmlIds.length,
  duplicateHtmlIds: 0,
  serviceWorkerAssets: cachedAssets.length,
  workflowPhases: workflow.lifecyclePhases.length,
  workflowGates: workflow.gates.length,
  gateChecklistItems: workflow.gates.reduce((sum,gate)=>sum+gate.checklist.length,0),
  workflowChainSteps: workflow.workflowChain.length,
  handoffTypes: workflow.handoffTypes.length,
  workflowFiles: workflow.workflowFiles.length,
  importScopeGuards: 2,
  compactProjectNavigation: 'present',
  publicDataScan: 'clean',
  todoDataBlobSha: todoBlobSha
}, null, 2));
