

import { JSXElement, Show, createContext, createEffect, createSignal, useContext } from "solid-js";
import { createWs } from "../core/socket";
import { useLocation, useNavigate } from "@solidjs/router";
import { useLn } from "../login/passkey_i18n";

import { Body, Title } from "../layout/nav";
import { SiteMenuContent } from "../layout/site_menu";
import { FakeEditor, FakeScroll } from "../editor";
import Editor from "../lexical/RichTextEditor";


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

// this is the SPA

const PageContext = createContext<SitePage>();
export function useSite() { return useContext(PageContext); }

export interface Site {
  did: string
  name: string
  caps: Caps


}

export interface SitePage {
  site: Site
  branch: string  // or tag
  dbid: string
  appname: string
  path: string   // interpreted by app, but general a path
  app: () => JSXElement
}

export interface Caps {
  read: boolean
  write: boolean
  admin: boolean
}

type Maybe<T> = Promise<[T?, Error?]>

export type AppMap = {
  [key: string]: () => JSXElement
}



export async function getSite(did: string): Maybe<Site> {
  return [{
    did: did,
    name: "datagrove",
    caps: {
      read: true,
      write: true,
      admin: true,
    }

  }, undefined]
}


function Page(props: { children: JSXElement }) {
  const st = useSite()
  return <div class='flex h-screen w-screen fixed overflow-hidden'>
    <div class=' w-96 h-full  overflow-auto dark:bg-gradient-to-r dark:from-neutral-900 dark:to-neutral-800'>
      <SiteMenuContent /></div>
    {props.children}
    <InfoBox />
  </div>
}
function FakeAdmin() {
  return <Page>
    <div>admin</div>
  </Page>
}
function FakeEdit() {
  return <Page>
   <Editor/>
  </Page>
}


function FakeChat() {
  return <Page>
    <div>chat</div>
  </Page>
}
function FakeSettings() {
  return <Page>
    <div>settings</div>
  </Page>
}
function FakeWhiteboard() {
  return <Page>
    <div>settings</div>
  </Page>
}
function FakeSheet() {
  return <Page>
    <FakeScroll/>
    </Page>
}
// some apps, like login, don't need a database and shouldn't show a sitemap
export function HomePage() {

  const apps: AppMap = {
    "home": FakeScroll,
    "edit": FakeEdit,
    "chat": FakeChat,
    "settings": FakeSettings,
    "admin": FakeAdmin,
    "whiteboard": FakeWhiteboard,
    "sheet": FakeSheet,
  }
  const ws = createWs()
  const ln = useLn()
  const nav = useNavigate()
  const loc = useLocation()

  // should probably be a context? doesn't everything need the site?

  // should this be a store instead? 
  const [sitePage, setSitePage] = createSignal<SitePage>()
  const [err, setErr] = createSignal<Error>()

  // each organization needs branch. 
  // maybe app should come first. ln/app/org/branch/dbid/path
  // if they ask for an org that is not accessible, then we should show special page?
  // maybe it should be a signup page?
  createEffect(async () => {
    const p = loc.pathname.split("/")
    const ln = p[1]
    const appname = p[2]
    const app = apps[appname]
    const owner = p[3] // owner / ln / branch / db  / viewpath    

    // this could fail because owner doesn't exist, or because the owner doesn't want visitors. the owner could have special login requirements.
    // I need some kind of suspense processing here.
    const [s, e] = await getSite(owner)


    // do we probe the server for this? eventually the server will move to the shared worker. Our websocket will also move to the shared worker, with a proxy in worker threads. we need a cookie/storage strategy to limit logins.
    if (e) {
      setErr(e)
      setSitePage(undefined)
    } else {
      const pg: SitePage = {
        site: s!,
        branch: p[3],
        dbid: p[4],
        appname: appname,
        path: p.slice(6).join("/"),
        app: app
      }
      setSitePage(pg)
    }
  })

  return <PageContext.Provider value={sitePage()}>
    <Show when={sitePage()} fallback={<div>loading</div>}>
      {sitePage()!.app()}
    </Show>
  </PageContext.Provider>
}

// potentially a table of contents for current page

// controlled by the mounting app?
function InfoBox() {
  return <div> </div>
}

function Nosite(props: {}) {
  return <div>Site not found</div>
}

// every page will position the drawer menu; if it has no place in the menu
// then position to the one in recent. otherwise, position to the one in the menu so that they have the normal context




/*
const catchall = () => {
    const nav = useNavigate()
    const p = useParams()
    const appname = p["app"]
    //nav(`${prefix}/en/login`)



    return <Show when={fn} fallback={<div>app {appname} not found</div>}>
        {fn!()}
        </Show>
}
*/
