'use strict';
const CACHE_PREFIX='iraab-shell-';
const CACHE_NAME=CACHE_PREFIX+'v0.39.0';
const CORE=['./','./index.html','./styles.css','./content.js','./app.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./fonts/Amiri-Regular.woff','./fonts/Amiri-Bold.woff'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(CACHE_PREFIX)&&k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;event.respondWith(caches.match(req).then(cached=>{const network=fetch(req).then(response=>{if(response&&response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(req,copy));}return response;}).catch(()=>null);return cached||network.then(response=>response|| (req.mode==='navigate'?caches.match('./index.html'):new Response('غير متاح دون اتصال',{status:503,statusText:'Offline'})));}));});
