const CACHE_NAME = 'mika-ai-project-management-v1-1-syntaxfix-2026-07-10';
const APP_SHELL = [
  './','./index.html','./styles.css','./styles-features.css','./styles-responsive.css','./styles-components.css','./styles-v1-1-polish.css',
  './app-bootstrap.js','./app-core.js','./app-core-2.js','./app-core-3.js','./app-core-4.js',
  './app-views.js','./app-views-2.js','./app-views-3.js','./app-views-4.js','./app-views-5.js','./app-views-6.js',
  './app.js','./app-2.js','./app-3.js','./app-v1-1-polish.js','./project-data.json','./projects/project-finanztracker.json','./projects/project-management-tool.json','./todo-data.json'
];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const request=event.request;
  const freshRequest=new Request(request,{cache:'no-store'});
  if(request.mode==='navigate'){
    event.respondWith(fetch(freshRequest).then(response=>{
      if(response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put('./index.html',copy)).catch(()=>{});}
      return response;
    }).catch(()=>caches.match('./index.html')));
    return;
  }
  event.respondWith(fetch(freshRequest).then(response=>{
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    const copy=response.clone();
    caches.open(CACHE_NAME).then(cache=>cache.put(request,copy)).catch(()=>{});
    return response;
  }).catch(async()=>{
    const cached=await caches.match(request,{ignoreSearch:true});
    if(cached)return cached;
    const destination=request.destination||'';
    const contentType=destination==='script'?'text/javascript; charset=utf-8':destination==='style'?'text/css; charset=utf-8':request.url.includes('.json')?'application/json; charset=utf-8':'text/plain; charset=utf-8';
    return new Response('Offline resource unavailable',{status:503,statusText:'Offline resource unavailable',headers:{'Content-Type':contentType,'Cache-Control':'no-store'}});
  }));
});
