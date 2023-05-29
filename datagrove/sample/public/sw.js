/*
 * Wayne - Server Worker Routing library
 *
 * Copyright (c) 2022-2023 Jakub T. Jankiewicz <https://jcubic.pl/me>
 * Released under MIT license
 */

const root_url = location.pathname.replace(/\/[^\/]+$/, '');
const root_url_re = new RegExp('^' + escape_re(root_url));

function normalize_url(url) {
  return url.replace(root_url_re, '');
}

function escape_re(str) {
  if (typeof str == 'string') {
    var special = /([\^\$\[\]\(\)\{\}\+\*\.\|])/g;
    return str.replace(special, '\\$1');
  }
}

function is_function(arg) {
  return typeof arg === 'function';
}

function is_promise(arg) {
  return arg && typeof arg === 'object' && is_function(arg.then);
}

// taken from Isomorphic-git MIT license
function isPromiseFs(fs) {
  const test = targetFs => {
    try {
      // If readFile returns a promise then we can probably assume the other
      // commands do as well
      return targetFs.readFile().catch(e => e)
    } catch (e) {
      return e
    }
  }
  return is_promise(test(fs));
}

 class HTTPResponse {
  constructor(resolve) {
    this._resolve = resolve;
  }
  html(data, init) {
    this.send(data, { type: 'text/html', ...init });
  }
  text(data, init) {
    this.send(data, init);
  }
  json(data, init) {
    this.send(JSON.stringify(data), { type: 'application/json', ...init });
  }
  blob(blob, { type = 'text/plain', ...init } = {}) {
    this._resolve(new Response(blob, init));
  }
  send(data, { type = 'text/plain', ...init } = {}) {
    if (![undefined, null].includes(data)) {
      data = new Blob([data], {
        type
      });
    }
    this.blob(data, init);
  }
  redirect(code, url) {
    if (url === undefined) {
      url = code;
      code = 302;
    }
    if (!url.match(/https?:\/\//)) {
      url = root_url + url;
    }
    this._resolve(Response.redirect(url, code));
  }
  sse({ onClose } = {}) {
    let send, close, stream, defunct;
    stream = new ReadableStream({
      cancel() {
        defunct = true;
        trigger(onClose);
      },
      start: controller => {
        send = function(event) {
          if (!defunct) {
            const chunk = createChunk(event);
            const payload = new TextEncoder().encode(chunk);
            controller.enqueue(payload);
          }
        };
        close = function close() {
          controller.close();
          stream = null;
          trigger(onClose);
        };
      }
    });
    this._resolve(new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Connection': 'keep-alive'
      }
    }));
    return {
      send,
      close
    };
  }
}

// code extracted from https://github.com/jcubic/route.js
// Copyright (C) 2014-2017 Jakub T. Jankiewicz <https://jcubic.pl/me>
 function RouteParser() {
  const name_re = '[a-zA-Z_][a-zA-Z_0-9]*';
  const self = this;
  const open_tag = '{';
  const close_tag = '}';
  const glob = '*';
  self.route_parser = function(open, close) {

    const routes = {};
    const tag_re = new RegExp('(' + escape_re(open) + name_re +
                              escape_re(close) +  '|' +
                              escape_re(glob) + ')', 'g');
    const clear_re = new RegExp(escape_re(open) + '(' + name_re + ')' +
                                escape_re(close), 'g');
    return function(str) {
      const result = [];
      let index = 0;
      str = str.split(tag_re).map(function(chunk) {
        if (chunk === glob) {
          result.push(index++);
          return '(.*?)';
        } else if (chunk.match(tag_re)) {
          result.push(chunk.replace(clear_re, '$1'));
          return '([^\\/]+)';
        } else {
          return chunk;
        }
      }).join('');
      return {re: str, names: result};
    };
  };
  const parse = self.route_parser(open_tag, close_tag);
  self.parse = parse;
  self.pick = function(routes, url) {
    let input;
    let keys;
    if (routes instanceof Array) {
      input = {};
      keys = routes;
      routes.map(function(route) {
        input[route] = route;
      });
    } else {
      keys = Object.keys(routes);
      input = routes;
    }
    const results = [];
    for (let i=keys.length; i--;) {
      const pattern = keys[i];
      const parts = parse(pattern);
      const m = url.match(new RegExp('^' + parts.re + '$'));
      if (m) {
        const matched = m.slice(1);
        const data = {};
        if (matched.length) {
          parts.names.forEach((name, i) => {
            data[name] = matched[i];
          });
        }
        results.push({
          pattern,
          data
        });
      }
    }
    return results;
  };
}

function html(content) {
  return [
    '<!DOCTYPE html>',
    '<html>',
    '<head>',
    '<meta charset="UTF-8">',
    '<title>Wayne Service Worker</title>',
    '</head>',
    '<body>',
    ...content,
    '</body>',
    '</html>'
  ].join('\n');
}

function error500(error) {
  var output = html([
    '<h1>Wayne: 500 Server Error</h1>',
    '<p>Service worker give 500 error</p>',
    `<p>${error.message || error}</p>`,
    `<pre>${error.stack || ''}</pre>`
  ]);
  return [output, {
    status: 500,
    statusText: '500 Server Error'
  }];
}

function dir(prefix, path, list) {
  var output = html([
    '<h1>Wayne</h1>',
    `<p>Content of ${path}</p>`,
    '<ul>',
    ...list.map(name => {
      return `<li><a href="${root_url}${prefix}${path}${name}">${name}</a></li>`;
    }),
    '</ul>'
  ]);
  return [output, {
    status: 404,
    statusText: '404 Page Not Found'
  }];
}

function error404(path) {
  var output = html([
    '<h1>Wayne: 404 File Not Found</h1>',
    `<p>File ${path} not found`
  ]);
  return [output, {
    status: 404,
    statusText: '404 Page Not Found'
  }];
}

function createChunk({ data, event, retry, id }) {
  return Object.entries({ event, id, data, retry })
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n') + '\n\n';
}

function trigger(maybeFn, ...args) {
  if (typeof maybeFn === 'function') {
    maybeFn(...args);
  }
}

function chain_handlers(handlers, callback) {
  return new Promise((resolve, reject) => {
    if (handlers.length) {
      let i = 0;
      (async function recur() {
        const handler = handlers[i];
        if (!handler) {
          return resolve();
        }
        try {
          const ret = await callback(handler, function next() {
            i++
            recur();
          });
        } catch(error) {
          reject(error);
        }
      })();
    }
  });
}

async function list_dir({ fs, path }, path_name) {
  const names = await fs.readdir(path_name);
  return Promise.all(names.map(async name => {
    const fullname = path.join(path_name, name);
    const stat = await fs.stat(fullname);
    if (stat.isDirectory()) {
      return `${name}/`;
    }
    return name;
  }));
}
function FileSystem({ prefix, path, fs, mime }) {
  if (!isPromiseFs(fs)) {
    throw new Error('Wayne: only promise based FS accepted');
  }
  const parser = new RouteParser();
  if (!prefix.startsWith('/')) {
    prefix = `/${prefix}`;
  }
  return async function(req, res, next) {
    const method = req.method;
    const url = new URL(req.url);
    let path_name = normalize_url(url.pathname);
    if (path_name.startsWith(prefix)) {
      if (req.method !== 'GET') {
        return res.send('Method Not Allowed', { status: 405 });
      }
      path_name = path_name.substring(prefix.length);
      if (!path_name) {
        path_name = '/';
      }
      try {
        const stat = await fs.stat(path_name);

        if (stat.isFile()) {
          const ext = path.extname(path_name);
          const type = mime.getType(ext);
          const data = await fs.readFile(path_name, "utf8");
          res.send(data, { type });
        } else if (stat.isDirectory()) {
          res.html(...dir(prefix, path_name, await list_dir({ fs, path }, path_name)));
        }
      } catch(e) {
        if (typeof stat === 'undefined') {
          res.html(...error404(path_name));
        } else {
          res.html(...error500(error));
        }
      }
    } else {
      next();
    }
  };
}

class Wayne {
  constructor() {
    this._er_handlers = [];
    this._middlewares = [];
    this._routes = {};
    this._timeout = 5 * 60 * 1000; // 5 minutes
    this._parser = new RouteParser();
    self.addEventListener('fetch', (event) => {
      event.respondWith(new Promise(async (resolve, reject) => {
        const req = event.request;
        try {
          const res = new HTTPResponse(resolve);
          await chain_handlers(this._middlewares, function(fn, next) {
            return fn(req, res, next);
          });
          const method = req.method;
          const url = new URL(req.url);
          const path = normalize_url(url.pathname);
          const routes = this._routes[method];
          if (routes) {
            const match = this._parser.pick(routes, path);
            if (match.length) {
              const [first_match] = match;
              const fns = [...this._middlewares, ...routes[first_match.pattern]];
              req.params = first_match.data;
              setTimeout(function() {
                reject('Timeout Error');
              }, this._timeout);
              await chain_handlers(fns, (fn, next) => {
                return fn(req, res, next);
              });
              return;
            }
          }
          if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') {
            return;
          }
          //request = credentials: 'include'
          fetch(event.request).then(resolve).catch(reject);
        } catch(error) {
          this._handle_error(resolve, req, error);
        }
      }));
    });
    ['GET', 'POST', 'DELETE', 'PATCH', 'PUT'].forEach(method => {
      this[method.toLowerCase()] = this.method(method);
    });
  }
  _handle_error(resolve, req, error) {
    const res = new HTTPResponse(resolve);
    if (this._er_handlers.length) {
      chain_handlers(this._er_handlers, function(handler, next) {
        handler(error, req, res, next);
      }, function(error) {
        res.html(...error500(error));
      });
    } else {
      res.html(...error500(error));
    }
  }
  use(...fns) {
    fns.forEach(fn => {
      if (typeof fn === 'function') {
        if (fn.length === 4) {
          this._er_handlers.push(fn);
        } else if (fn.length === 3) {
          this._middlewares.push(fn);
        }
      }
    });
  }
  method(method) {
    return function(url, fn) {
      if (!this._routes[method]) {
        this._routes[method] = {};
      }
      const routes = this._routes[method];
      if (!routes[url]) {
        routes[url] = [];
      }
      routes[url].push(fn);
      return this;
    };
  }
}

const app = new Wayne();

const users = {
  1: 'Jakub T. Jankiewicz',
  2: 'John Doe',
  3: 'Jane Doe'
};

app.get('/user/{id}', function(req, res) {
  const user = users[req.params.id];
  if (user) {
    res.json({result: user});
  } else {
    res.json({error: 'User Not Found'});
  }
});

app.get('/error', function(req, res) {
  nonExisting();
});

app.get('/__fs__/*/name/*', function(req, res) {
  res.text(req.params[0] + ' ' + req.params[1]);
});

app.get('/download', async function(req, res) {
  const text = await fetch('http://localhost/~kuba/jcubic/wayne/repo/docs/hacker.txt')
        .then(res => res.text());
  const headers = {
    'Content-Disposition': 'attachment; filename="hacker.txt"'
  };
  res.text(text, { headers });
});

if (app.use) {
  app.use((err, req, res, next) => {
    const sep = '-'.repeat(80);
    res.text([sep, ':: Wayne', sep, `Error: ${err.message}`, err.stack].join('\n'));
  });
}