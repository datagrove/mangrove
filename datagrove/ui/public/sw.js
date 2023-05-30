
 

// self.addEventListener("fetch", event => {
//     let url = new URL(event.request.url);
//     if (url.pathname.startsWith("/test")) {
//       event.respondWith(new Response("Hello from worker!"));
//     }
//   });

let leader

const waiting = new Map()
let next = 0

function leaderRespond(data) {
 
  let {method, id, params , result, error } = data
  if (result || error) {
    let o = waiting.get(id)
    if (o) {
      waiting.delete(id)
      if (error) {
        o.reject(error)
      } else {
        r = new Response(result)
        o.resolve(result)
      }
    }
  } else {
    switch (method) {
      default:
        break;
    }
  }

}
async function fromLeader(url) {
  const ok = !!leader
  if (ok) leader.postMessage({method: 'fetch', id: next, params: url})
  return new Response(`Hello from worker6! ${ok}`)
  next++
  return new Promise((resolve, reject) => {
    waiting.set(next, {resolve, reject})
    leaderRespond({id: next, result: new Blob("Hello from worker wtf!")})
  })
}
self.addEventListener("fetch",  (event) => {
    let url = new URL(event.request.url);
    if (url.pathname.startsWith("/~")) {
      event.respondWith(fromLeader(event.request.url));
    }
  });

self.addEventListener('message', (event) => {
   console.log('message', event.data)
    const d = event.data;
    switch(d.method) {
    case 'connect':
      leader = d.params
      leader.port2.onmessage = (event) => {
        leaderRespond(event.data)
      }
      break;
    }
  });