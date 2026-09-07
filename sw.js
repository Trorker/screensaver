/* Increment VERSION when publishing updated code or bundled data. */
const PREFIX = 'istante-' + encodeURIComponent(self.registration.scope) + '-';
const VERSION = PREFIX + '2.0.0';
const FILES = ['./','./index.html','./style.css','./core.js','./main.js','./data/phrases.js','./data/frasi_motivazionali_700.json','./manifest.webmanifest','./assets/icon.svg','./assets/icon-192.png','./assets/icon-512.png'];
const ALLOWED = new Set(FILES.map(path => new URL(path,self.registration.scope).href));
self.addEventListener('install',event=>{event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==VERSION).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||!ALLOWED.has(event.request.url))return;
 event.respondWith((async()=>{
  try{const response=await fetch(event.request);if(response.ok&&response.type!=='opaque'){const cache=await caches.open(VERSION);await cache.put(event.request,response.clone());return response;}return(await caches.match(event.request))||response;}
  catch(_){return(await caches.match(event.request))||new Response('Risorsa non disponibile offline.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});}
 })());
});
