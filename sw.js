const CACHE='zerostock-v3.4-delete-cartons';
const CORE=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
const QR_HOSTS=new Set(['cdn.jsdelivr.net','unpkg.com','cdnjs.cloudflare.com']);

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);

  if(QR_HOSTS.has(u.hostname)){
    e.respondWith(
      caches.open(CACHE).then(async c=>{
        const cached=await c.match(e.request);
        if(cached)return cached;
        const res=await fetch(e.request);
        if(res&&res.ok)c.put(e.request,res.clone());
        return res;
      })
    );
    return;
  }

  if(u.origin!==location.origin)return;

  e.respondWith(
    fetch(e.request,{cache:'no-store'})
      .then(r=>{
        const copy=r.clone();
        caches.open(CACHE).then(c=>c.put(e.request,copy));
        return r;
      })
      .catch(()=>caches.match(e.request).then(x=>x||caches.match('./index.html')))
  );
});