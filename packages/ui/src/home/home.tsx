

import { For, JSXElement, Match, Show, Suspense, Switch, createContext, createEffect, createResource, createSignal, useContext } from "solid-js";
import { createWs } from "../core/socket";
import { useLocation, useNavigate } from "@solidjs/router";
import { useLn } from "../login/passkey_i18n";

import { SiteMenuContent } from "./site_menu";
import { Icon, } from "solid-heroicons";
import { clock, pencil, bookOpen as menu, squaresPlus as add, chatBubbleBottomCenter as friend, cog_6Tooth as gear, magnifyingGlass } from "solid-heroicons/solid";
import { Maybe } from "../core";
import { TextEditor, TextViewer } from './viewer/text'
import { ChatViewer, CodeViewer, SheetViewer, WhiteboardViewer } from "./viewer";
import { SettingsViewer } from "./viewer/settings";
import { FolderViewer } from "./viewer/folder";
import { Splitter } from "../layout/splitter";
import { DarkButton } from "../lib";
import { Viewer, Tool, SitePage, SiteRef, SiteDocumentRef, getDocument, UserState, UserSettings, UserContext, getUser, useUser, DocumentContext, SitePageContext } from "./store";
import { createWindowSize } from "@solid-primitives/resize-observer";
import { SearchPanel } from "./search";
import { Settings } from "./settings";
import { Message } from "./message";


// tools don't all need a site, but most do
// ln/search is valid
// 

// viewers are selected by the document type, can be overridden by the hash
type ViewerMap = {
  [key: string]: Viewer
}
// viewers are picked by the document referenced in the path, but may also put information in the hash
// document types; map to common mime types?

const builtinViewers: ViewerMap = {
  "folder": { default: () => <FolderViewer /> },
  "text": { default: () => <TextViewer /> },
  "text-edit": { default: () => <TextEditor /> },
  "chat": { default: () => <ChatViewer /> },
  "settings": { default: () => <SettingsViewer /> },
  "whiteboard": { default: () => <WhiteboardViewer /> },
  "sheet": { default: () => <SheetViewer /> },
  "code": { default: () => <CodeViewer /> },
  "form": { default: () => <div>Form</div> } // can also be perspective of text?
}

// each tool is associated with a database, and a home "page" in the database which is used the first time the tool is used.
// this is 
// each tool maintains its last state, it switches the menu and the viewer
// each has its own history? that's pretty hard on the web, and probably confusing.
// try going the most recent url associated with the tool.

const builtinTools: { [key: string]: Tool } = {
  "menu": {
    icon: () => <FloatIcon path={menu} />,
    component: () => <SiteMenuContent />,
    path: 'a/b/text'
  },
  "dm": {
    icon: () => <FloatIcon path={friend} />,
    component: () => <Message />,
    path: 'a/b/chat'
  },
  "settings": {
    icon: () => <FloatIcon path={gear} />,
    component: () => <Settings />,
    path: 'a/b/form',
  },
  "search": {
    icon: () => <FloatIcon path={magnifyingGlass} />,
    component: () => <div><SearchPanel /></div>,
    path: 'a/b/folder'
  }
}

// change when we install new tools? or when we change the active tool?
export const [tools, setTools] = createSignal(builtinTools)
export const [viewers, setViewers] = createSignal(builtinViewers)

// should restore the state the last time we were using DM?
// this changes the viewer and the pane. 


// pinned tools can change the viewer, e.g.
export function PinnedTool() {
  return <span class="relative inline-block">
    <img class="h-8 w-8 rounded-full" src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="" />
    <span class="absolute right-0 top-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
  </span>
}

export function UserProvider(props: { children: JSXElement }) {
  const anon: UserSettings = {
    tools: [
      "menu",
      "search",
      "dm",

      "pindm",
      "pindb",
      "settings", // setting is similar to home database
    ],
    pindm: [],
    pindb: [],
    recentdb: []
  }
  const userState: UserState = {
    settings: anon,
    counters: {}
  }

  const [user] = createResource(getUser)
  return <Suspense fallback={<div>Logging in</div>}>
    <UserContext.Provider value={user()}>
      <Main />
    </UserContext.Provider>
  </Suspense>
}

export function Main() {
  const ws = createWs()
  const ln = useLn()
  const nav = useNavigate()
  const loc = useLocation()
  const user = useUser()
  if (!user) {
    nav("/login")
    return
  }

  const purl = () => {
    const p = loc.pathname.split("/")
    const h = loc.hash.split("/")
    // owner / ln / branch / db  / viewpath  
    return {
      ln: p[1],
      toolname: p[2] ?? "menu",
      owner: [3] ?? "",
      site: p[4] ?? "home",
      viewer: h[0] ?? "",
      path: p.slice(5).join("/")
    }
  }
  // the sitePage is derived from the location. maybe memo it? 
  const siteRef = (): SiteRef => {
    return {
      name: purl().site,
    }
  }
  const page = (): SiteDocumentRef => {
    return {
      site: siteRef(),
      path: purl().path,
    }
  }
  const sitePage = (): SitePage => {
    return {
      doc: page(),
      viewer: purl().viewer,
      toolname: purl().toolname,
    }
  }
  //const [sitePage, setSitePage] = createSignal<SitePage>()
  const [err, setErr] = createSignal<Error>()
  const [doc] = createResource(page(), getDocument)


  // is this a resource or many? we need to get the counts for all the user shortcuts
  // getting the user store is also a reference.
  const getCounter = (name: string) => {
    return 0
  }


  // how do we display counters? how do we update them?
  // when does clicking a tool change the viewer? always?
  const setActiveTool = (name: string) => {
    const p = loc.pathname.split("/")[1]
    const tl = tools()[name]
    const pth = "/" + p + "/" + name + "/" + tl.path //+ loc.pathname.split("/").slice(3).join("/")
    console.log("path", name, pth)
    nav(pth)
  }

  const ml = (e: string) => e == sitePage()?.toolname ? "border-white" : "border-transparent"
  const Toolicons = () => {
    return <div class='w-14 flex-col flex mt-4 items-center space-y-6'>

      <For each={user.settings.tools}>{(e, i) => {
        const tl = tools()[e]
        return <Switch>
          <Match when={e == "pindm"}>
            <For each={user.settings.pindm}>
              {(e, i) => {
                // show avatar if available
                return <RoundIcon path={pencil} onClick={() => nav("/" + e)} />
              }
              }
            </For>
          </Match>
          <Match when={e == "pindb"}>
            <For each={user.settings.pindb}>{(e, i) => {
              // use database icon if available     
              return <RoundIcon path={pencil} onClick={() => nav("/" + e)} />
            }
            }
            </For>
          </Match>
          <Match when={e == "recentdb"}>
            <For each={user.settings.recentdb}>{(e, i) => {
              // use database icon if available
              return <RoundIcon path={pencil} onClick={() => nav("/" + e)} />
            }}
            </For>
          </Match>
          <Match when={true}>
            <Show when={tl} fallback={<div>{e}</div>}>
              <div class={`border-l-2 ${ml(e)} h-8 w-12  text-center`}><button class='block ml-2' onClick={() => setActiveTool(e)}>{tl.icon()}</button>
              </div>
            </Show>
          </Match>
        </Switch>
      }
      }</For>
      <DarkButton />
    </div>
  }
  // we also need to understand the document type here.
  // 
  const toolpane = () => sitePage()?.toolname ? tools()[sitePage()?.toolname].component() : <div>no tool</div>

  // this isn't right?


  const viewer = (doctype?: string): () => JSXElement => {
    const openWith = sitePage().viewer;
    doctype ??= ""
    let vn = openWith ? doctype + "-" + openWith : doctype
    const vt = viewers()[vn]
    if (!vt) return () => <div>no viewer {vn}</div>
    return vt.default
  }

  const [left, setLeft] = createSignal(400)
  return <Show when={sitePage()} >
    <div class='flex h-screen w-screen fixed overflow-hidden'>
      <Splitter left={left} setLeft={setLeft}>
        <div class='flex flex-1'>
          <Toolicons />
          <div class=' flex-1 overflow-auto dark:bg-gradient-to-r dark:from-black dark:to-neutral-900'>
            <Suspense fallback={<div>waiting</div>}>
              <SitePageContext.Provider value={sitePage()}>
                {toolpane()}
              </SitePageContext.Provider>
            </Suspense>
          </div>
        </div>
        <div class='absolute' style={{
          left: (left() + 20) + "px",
          right: "0px",
          top: "0px",
          bottom: "0px"
        }}>
          <Suspense fallback={<div>Loading document</div>}>
            <DocumentContext.Provider value={doc()!}>
              {viewer(doc()?.type)()}
            </DocumentContext.Provider>
          </Suspense>
          <InfoBox />
        </div>
      </Splitter>
    </div>
  </Show>

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

type IconPath = typeof clock
export function RoundIcon(props: { path: IconPath, onClick?: () => void }) {
  return <button onClick={props.onClick}>
    <div ><Icon class='w-6 h-6' path={props.path}></Icon></div></button>
}
export function FloatIcon(props: { path: IconPath, onClick?: () => void }) {
  return <button onClick={props.onClick}>
    <div ><Icon class='w-8 h-8' path={props.path}></Icon></div></button>
}

///////////////////////////////////////
// adaptive things - separate file?
export enum ShowPagemap {
  adaptive,  // adaptive -> click = toggle. so once its closed or open it can no longer be adaptive.
  none,
  display,
}
// display needs to be full screen if the screen is small enough.
export enum ShowSitemap {
  adaptive,
  none,  // greater than 800 this is split
  full,
  split, // split is same as adaptive?
}


const [sitemap, setSitemap] = createSignal(ShowSitemap.adaptive)
export const [pagemap, setPagemap] = createSignal(ShowPagemap.adaptive)
// does it matter where the splitter is? we also need to derive that.
export const showSitemap = (): ShowSitemap => {
  const windowSize = createWindowSize();
  if (mobile()) {
    return sitemap() == ShowSitemap.none ? ShowSitemap.none : ShowSitemap.full
  }
  if (sitemap() == ShowSitemap.adaptive) {
    return windowSize.width > 850 ? ShowSitemap.split : ShowSitemap.none
  }
  // we need to check if there's room for the  sitemap
  // also need to allow the sitemap to shrink if window isn't wide enough.
  return sitemap()
}
export const showToc = (): boolean => {
  if (pagemap() == ShowPagemap.adaptive) {
    return mobile() ? false : true
  }
  return pagemap() == ShowPagemap.display
}
export const toggleSitemap = () => {
  console.log("no sitemap")
  setSitemap(showSitemap() == ShowSitemap.none ? ShowSitemap.split : ShowSitemap.none)
}
export const togglePagemap = () => {
  console.log("no pagemap")
  // once flipped, it can't be adaptive again. Is there a a better approach?
  setPagemap(showToc() ? ShowPagemap.none : ShowPagemap.display)
}
export const mobile = () => {
  const windowSize = createWindowSize();
  const r = windowSize.width < 650
  //console.log("windowWidth", windowSize.width)
  return r
}


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
