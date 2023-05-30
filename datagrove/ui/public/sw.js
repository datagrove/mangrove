
 

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
  console.log("response", data)
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
function log(s) {
  leader?.postMessage({method: 'log', params: [`%c ${s}`, 'color: blue']})
}
async function fromLeader(url) {
  return new Response(`Hello from worker7! ${!!leader} ${url}`)
  next++
  return new Promise((resolve, reject) => {
    waiting.set(next, {resolve, reject})
    leaderRespond({id: next, result: new Blob("Hello from worker wtf!")})
  })
}
async function notifyFetch(path) {
  console.log("notify", path)
  next++
  const cl = await self.clients.matchAll({
    includeUncontrolled: true,
  });
  cl.forEach(c => {
    c.postMessage({method: 'fetch', params: [path]})
  })
  return new Response(`Hello from worker! ${path}`)
}
self.addEventListener("fetch",  (event) => {
    let url = new URL(event.request.url);
    if (url.pathname.startsWith("/~")) {
      event.respondWith(notifyFetch(url.pathname))
    }
})

  //   log(`fetch ${url.pathname}`)
  //   if (url.pathname.startsWith("/test")) {
  //     event.respondWith(fromLeader(event.request.url));
  //   }
  // });
  // self.addEventListener('message', (event) => {
  //   if (event.data && event.data.type === 'INIT_PORT') {
  //     leader = event.ports[0];
  //     console.log('connected to leader')
  //   }
  // });
  self.addEventListener('message', (event) => {
    const d = event.data
    switch(d.method) {
    default:
        leaderRespond(d.params)
    }
  })
// self.addEventListener('message', (event) => {
//     console.log(JSON.stringify(event.data))
//     const d = event.data;
//     switch(d.method) {
//     case 'connect':
//       leader = event.ports[0]
//       break;
//     default:
//       leaderRespond(d)
//     }
//   });