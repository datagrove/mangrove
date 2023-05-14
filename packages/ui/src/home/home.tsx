

// is there

import { Show, createEffect, createSignal } from "solid-js";
import { createWs } from "../core/socket";
import { useLocation, useNavigate } from "@solidjs/router";
import { useLn } from "../login/passkey_i18n";
import { Site, getSite } from "../core/site";
import { Body, Page, Title } from "../layout/nav";


// we might want to access a sitemap here?
// most (all?) of our apps will have a database
// but they can access other databases and servers as well.

// we could be looking at our own home or someone else's home
// it will be somewhat different.

// if its our home, then we will be at
// {ouruser}/en/home
// if it's someone else's home then we will be at
// other/en/home
// here an issue is if the user is anonymous, then we need to use their secret string. we could say that anything shorter than X is a friendly name.

// in general this will be a did, but it could be a friendly name.


export function HomePage(props: {}) {
  const ws = createWs()
  const ln = useLn()
  const nav = useNavigate()
  const loc = useLocation()

  const [site, setSite] = createSignal<Site>()
  const [err, setErr] = createSignal<Error>()

  createEffect(async () => {
    const p = loc.pathname.split("/")
    const owner = p[1] // owner / ln / db / viewpath
    const dbid = p[3]
    const path = p.slice(4).join("/")
    const [s, e] = await getSite(owner)
    // do we probe the server for this? eventually the server will move to the shared worker. Our websocket will also move to the shared worker, with a proxy in worker threads. we need a cookie/storage strategy to limit logins.
    if (e) {
      setErr(e)
      setSite(undefined)
    } else {
      setSite(s)
    }
  })

  return (
    <div>
      <Show when={site()} fallback={<Nosite />}>
        <Home site={site()!} />
      </Show>
    </div>
  );
}

function Nosite(props: {}) {
  return <div>Site not found</div>
}


// should we get site from a signal? passed as a prop? as a context?
function Home(props: { site: Site }) {
  // need to create a Component from the presentation
  return <Page>
    <Title></Title>
    <Body><PresentationView present={ /></Body>
  </Page>
}


