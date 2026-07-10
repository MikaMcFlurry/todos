import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const exists = file => fs.existsSync(path.join(root, file));
const fail = message => { throw new Error(message); };

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

const serviceWorker = read('service-worker.js');
const cachedAssets = [...serviceWorker.matchAll(/'\.\/([^']*)'/g)].map(match => match[1]).filter(Boolean);
const missingCacheAssets = cachedAssets.filter(ref => !exists(ref));
if (missingCacheAssets.length) fail(`Missing service-worker assets: ${missingCacheAssets.join(', ')}`);

const publicFiles = ['project-data.json', ...registry.projectFiles.map(ref => ref.path)];
const publicText = publicFiles.map(read).join('\n');
for (const [name, pattern] of [
  ['embedded image', /data:image\//i],
  ['raw screenshots collection', /"screenshots"\s*:/i],
  ['legacy test state', /"testState"\s*:/i],
  ['general private notes', /"generalNotes"\s*:/i],
  ['probable secret value', /(api[_-]?key|access[_-]?token|secret)["']?\s*[:=]\s*["'][^"']{8,}/i]
]) {
  if (pattern.test(publicText)) fail(`Public-data scan found ${name}.`);
}

const workflow = registry.workflowTemplates || {};
if ((workflow.lifecyclePhases || []).length !== 11) fail('Expected workflow phases 0–10.');
if ((workflow.gates || []).length !== 6) fail('Expected six workflow gates.');
if ((workflow.workflowFiles || []).length !== 15) fail('Expected 15 reusable workflow files.');

console.log(JSON.stringify({
  schema: registry.schema,
  projects: ids,
  htmlAssets: refs.length,
  serviceWorkerAssets: cachedAssets.length,
  workflowPhases: workflow.lifecyclePhases.length,
  workflowGates: workflow.gates.length,
  workflowFiles: workflow.workflowFiles.length,
  publicDataScan: 'clean'
}, null, 2));
