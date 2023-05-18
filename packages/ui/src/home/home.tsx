

import { For, JSXElement, Match, Show, Switch, createContext, createEffect, createSignal, useContext } from "solid-js";
import { createWs } from "../core/socket";
import { useLocation, useNavigate } from "@solidjs/router";
import { useLn } from "../login/passkey_i18n";

import { SiteMenuContent } from "./site_menu";
import { Icon, } from "solid-heroicons";
import { clock, pencil, bookOpen as menu, squaresPlus as add, chatBubbleBottomCenter as friend, cog_6Tooth as gear, magnifyingGlass } from "solid-heroicons/solid";
import { user } from "./user";
import { Maybe } from "../core";
import { TextViewer } from './viewer/text'
import { ChatViewer, CodeViewer, SheetViewer, WhiteboardViewer } from "./viewer";
import { SettingsViewer } from "./viewer/settings";
import { FolderViewer } from "./viewer/folder";
import { Splitter } from "../layout/splitter";
import { DarkButton } from "../lib";
import { Viewer, Tool, SitePage, PageContext } from "./store";
import { getDocument } from "./storedb";




// user settings should be a store? does the context deliver a store then?
// is a database something related but different than a store?


type ViewerMap = {
  [key: string]: Viewer
}
// viewers are picked by the document referenced in the path, but may also put information in the hash
// document types; map to common mime types?

const builtinViewers: ViewerMap = {
  "folder": { default: () => <FolderViewer /> },
  "text": { default: () => <TextViewer /> },
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
    component: () => <DmTool />,
    path: 'a/b/chat'
  },
  "settings": {
    icon: () => <FloatIcon path={gear} />,
    component: () => <div>settings</div>,
    path: 'a/b/form',
  },
  "add": {
    icon: () => <FloatIcon path={add} />,
    component: () => <div>settings</div>,
    path: 'a/b/form'
  },
  "search": {
    icon: () => <FloatIcon path={magnifyingGlass} />,
    component: () => <div>search</div>,
    path: 'a/b/folder'
  }
}

// change when we install new tools? or when we change the active tool?
export const [tools, setTools] = createSignal(builtinTools)
export const [viewers, setViewers] = createSignal(builtinViewers)

// should restore the state the last time we were using DM?
// this changes the viewer and the pane. 
export function DmTool() {
  return <div>dm</div>
}

// pinned tools can change the viewer, e.g.
export function PinnedTool() {
  return <span class="relative inline-block">
    <img class="h-8 w-8 rounded-full" src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="" />
    <span class="absolute right-0 top-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
  </span>
}

export function Main() {
  const ws = createWs()
  const ln = useLn()
  const nav = useNavigate()
  const loc = useLocation()

  const [sitePage, setSitePage] = createSignal<SitePage>()
  const [err, setErr] = createSignal<Error>()


  createEffect(async () => {
    const oid = "did:web:datagrove.io:home"
    // await getUser()?
    // we can start incognito, but the site may not allow, so wait
    const user = {
      name: oid,
      tools: ["alert"]

    }
    const p = loc.pathname.split("/")
    // owner / ln / branch / db  / viewpath  
    const ln = p[1]

    // if we don't recognize tool, pick menu tool
    // should we redirect  then?
    const toolname = p[2] ?? "menu"

    const owner = p[3] ?? "oid"
    const database = p[4] ?? "home"

    const h = loc.hash.split("/")
    const viewer = h[0] ?? ""
    const path = p.slice(5).join("/")
    // this could fail because owner doesn't exist, or because the owner doesn't want visitors. the owner could have special login requirements.
    // I need some kind of suspense processing here.
    const [doc, e] = await getDocument(owner, database, path)
    if (!doc) {
      setErr(e)
      setSitePage(undefined)
    } else {
      // derive the viewer from the document type
      let viewer = builtinViewers[doc.type]
      if (!viewer) {
        // the viewer has to be modified based on the document type
        // we want to be able to specify the viewer so that the link can be shared
        // but maybe it should be in the hash?
        // we should hand the hash directly to the document type and let it decide what it means
        viewer = builtinViewers["home"]
      }
      let tool = builtinTools[toolname]
      if (!tool) {
        tool = builtinTools["menu"]
      }
      const pg: SitePage = {
        doc: doc,
        toolname: toolname,
        viewer: viewer,
        toolpane: tool
      }
      console.log("PAGE", pg)
      setSitePage(pg)
    }
  })

  // this needs to use the user value that counts this tool
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
  const [left, setLeft] = createSignal(400)
  return <PageContext.Provider value={sitePage()}>
    <Show when={sitePage()} fallback={<div>waiting</div>}>
      <div class='flex h-screen w-screen fixed overflow-hidden'>
        <Splitter left={left} setLeft={setLeft}>
          <div class='flex flex-1'>
            <Toolicons />
            <div class=' flex-1 overflow-auto dark:bg-gradient-to-r dark:from-neutral-900 dark:to-neutral-800'>
              {sitePage()!.toolpane.component()}
            </div>
          </div>
          <div class='absolute' style={{
            left: (left() + 20) + "px",
            right: "0px",
            top: "0px",
            bottom: "0px"
          }}>
            {sitePage()!.viewer.default()}
            <InfoBox />
          </div>
        </Splitter>
      </div>
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





type IconPath = typeof clock
export function RoundIcon(props: { path: IconPath, onClick?: () => void }) {
  return <button onClick={props.onClick}>
    <div ><Icon class='w-6 h-6' path={props.path}></Icon></div></button>
}
export function FloatIcon(props: { path: IconPath, onClick?: () => void }) {
  return <button onClick={props.onClick}>
    <div ><Icon class='w-8 h-8' path={props.path}></Icon></div></button>
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
