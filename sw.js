const CACHE='zerostock-v2.4.0';
const CORE=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.origin===location.origin){
    event.respondWith(
      caches.match(req).then(cached=>{
        const network=fetch(req).then(res=>{
          const copy=res.clone(); caches.open(CACHE).then(c=>c.put(req,copy)); return res;
        }).catch(()=>cached||caches.match('./index.html'));
        return cached||network;
      })
    );
  }
});