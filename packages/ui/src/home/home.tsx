

import { For, JSXElement, Match, Show, Suspense, Switch, createMemo, createResource, createSignal } from "solid-js";
import { createWs } from "../core/socket";
import { A, useLocation, useNavigate } from "@solidjs/router";
import { useLn } from "../login/passkey_i18n";

import { Icon, } from "solid-heroicons";
import { faceSmile, folder, signalSlash, user as avatar, sparkles, circleStack as dbicon, clock as history, pencil, bookOpen as menu, chatBubbleBottomCenter as friend, magnifyingGlass, arrowsRightLeft as eastWest, map } from "solid-heroicons/solid";
import { ChatViewer } from "./viewer";
import { SettingsViewer } from "./settings";
import { DarkButton } from "../lib";
import { createWindowSize } from "@solid-primitives/resize-observer";
import { SearchPanel, SearchViewer } from "./search";
import { Settings } from "./settings";
import { Message } from "./message";
import { DocumentContext, Graphic, SitePage, SitePageContext, Tool, getDocument, online, useUser } from "../core";
//import { SiteViewer } from "./site";
import { HomeViewer, Home } from "./home_viewer";
import { MapTool, MapViewer } from "./map";
import { DbTool, DbViewer } from "./db";
import { AiTool, AiViewer } from "./ai";
import { FolderTool, FolderViewer } from "./folder";
import { EditTool, EditViewer } from "./edit";

// mapview should start with flyout shut, even on large screens.

// every command calls setOut(false)? should this be in the hash?
// that way every navigation potentially closes it.
// the out status doesn't matter if screen is wide enough.
export const [isOut, setOut] = createSignal(false)

// the left icons set the rest of the screen
// map, 

// tools don't all need a site, but most do
// ln/search is valid
// Messages can have user assigned icons and labels for as many categories as they want


// viewers are picked by the document referenced in the path, but may also put information in the hash
// document types; map to common mime types?


// each tool is associated with a database, and a home "page" in the database which is used the first time the tool is used.
// this is 
// each tool maintains its last state, it switches the menu and the viewer
// each has its own history? that's pretty hard on the web, and probably confusing.
// try going the most recent url associated with the tool.

// history is not the same as find because find is sticky and remembers the current search, previous searches etc.
// thin out the icons, these should be sharable anyway

// how can we make vite move about "domains", when they are all on localhost, without confusing it? do we still need the database part of the path if we are using the subdomain for the same purpose? Maybe there's a difference? The problem is that when we are editing a database, we are also previewing it. Could the preview come from an iframe always? Would this be security enough? can we sanitize the data securely enough to edit it? what is the downside to continually switching domains? Can we imitate the domain in development using local storage? 

// to simulate: put the database in localstorage, then navigate to link.
// the router will reload starting from the database.


const builtinTools: { [key: string]: Tool } = {
  // "site": {
  //   icon: () => <FloatIcon path={menu} />,
  //   path: 'a/b/text',
  //   viewer: () => <SiteViewer />
  // },
  "edit": {
    icon: () => <FloatIcon path={pencil} />,
    component: () => <EditTool />,
    path: 'a/b/text',
    viewer: () => <EditViewer />
  },
  "db": {
    icon: () => <FloatIcon path={dbicon} />,
    component: () => <DbTool />,
    path: 'a/b/text',
    viewer: () => <DbViewer />
  },
  "map": {
    icon: () => <FloatIcon path={map} />,
    component: () => <MapTool />,
    path: 'a/b/text',
    viewer: () => <MapViewer />
  },
  "ai": {
    icon: () => <FloatIcon path={sparkles} />,
    component: () => <AiTool />,
    path: 'a/b/text',
    viewer: () => <AiViewer />
  },
  // Message component is also used for the alerts - how?
  "dm": {
    icon: () => <FloatIcon path={friend} />,
    component: () => <Message />,
    path: 'a/b/chat',
    viewer: () => <ChatViewer />
  },
  "alert": {
    icon: () => <FloatIcon path={friend} />,
    component: () => <Message />,
    path: 'a/b/chat',
    global: true,
    viewer: () => <ChatViewer />
  },
  "home": {
    icon: () => <FloatIcon path={faceSmile} />,
    component: () => <Home />,
    path: 'a/b/text',
    viewer: () => <HomeViewer />
  },
  "folder": {
    icon: () => <FloatIcon path={folder} />,
    component: () => <FolderTool />,
    path: 'a/b/text',
    viewer: () => <FolderViewer />
  },


  "account": {
    icon: () => <FloatIcon path={avatar} />,
    component: () => <Settings />,
    path: 'a/b/form',
    viewer: () => <SettingsViewer />
  },

  "search": {
    icon: () => <FloatIcon path={magnifyingGlass} />,
    component: () => <div><SearchPanel /></div>,
    path: 'a/b/folder',
    viewer: () => <SearchViewer />
  }
}


// change when we install new tools? or when we change the active tool?
export const [tools, setTools] = createSignal(builtinTools)


// should restore the state the last time we were using DM?
// this changes the viewer and the pane. 


// pinned tools can change the viewer, e.g.
export function PinnedTool() {
  return <span class="relative inline-block">
    <img class="h-8 w-8 rounded-full" src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="" />
    <span class="absolute right-0 top-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
  </span>
}


// const userState: UserState = {
//   settings: anon,
//   counters: {}
// }

export function XX() {
  const u = useUser()
  return <div>{JSON.stringify(u)}</div>
}
export function LoggedIn() {
  const user = useUser()
  console.log("user", user)

  const ws = createWs()
  const ln = useLn()
  const onav = useNavigate()
  const loc = useLocation()
  if (!user) {
    console.log("no user")
    return
  }

  const purl = createMemo(() => {
    const [err, setErr] = createSignal<Error>()
    const p = loc.pathname.split("/")
    const h = loc.hash.split("/")
    h[0] = h[0].slice(1)
    // owner / ln / branch / db  / viewpath  
    let toolp = (p[2] ?? "").split("-")
    let tool = toolp[0]
    let toolindex = toolp[1] ?? 0
    let ft = tools()[tool]
    let glb = ft?.global ?? false
    if (!ft) {
      console.log("bad tool", tool, ft, toolp, p[2], tools())
      tool = "home"
      ft = tools()[tool]
    }

    const r = {
      hash: h.slice(3).join("/"),
      ln: p[1],
      toolname: p[2], // this includes the index.
      owner: p[3] ?? "",
      site: p[4] ?? "",
      viewer: h[0] ?? "",
      flyout: h[1] ?? "",
      path: p.slice(5).join("/"),
      global: glb,
      allpath: loc.pathname,  // use to add hash modifiers
      toolindex: toolindex,
      tool: ft
    }
    console.log("purl", r)
    return r
  })



  // page is things we can get sync, no fetch
  const sitePage = (): SitePage => {
    return {
      user: user,
      hash: purl().hash,
      doc: {
        owner: purl().owner,
        site: purl().site,
        path: purl().path,
      },
      viewer: purl().viewer,
      toolname: purl().toolname,
      flyout: purl().flyout,
    }
  }

  // maybe the tool viewer should establish the document provider?
  const ToolViewer = () => {
    const [doc] = createResource(sitePage().doc, getDocument)
    return < Suspense fallback={< div > Loading document</div >}>
      <Switch>
        <Match when={doc.loading}>Loading...</Match>
        <Match when={doc.error}>Error: {doc.error.message}</Match>
        <Match when={doc()}>
          <DocumentContext.Provider value={doc()}>
            {purl().tool.viewer()}
          </DocumentContext.Provider>
        </Match>
      </Switch></Suspense>
  }
  // is this a resource or many? we need to get the counts for all the user shortcuts
  // getting the user store is also a reference.
  const getCounter = (name: string) => {
    return 0
  }

  const nav = (path: string) => {
    const p = loc.hash.split("/")
    const h = (p[0].length ? "" : "#") + "/y"
    onav(path + h)
  }
  // how do we display counters? how do we update them?
  // when does clicking a tool change the viewer? always?

  const [left_, setLeft] = createSignal(350)

  const count = (i: number) => { return i == 1 ? 2 : 0 }

  const setActiveTool = (toolname: string) => {
    const p = loc.pathname.split("/")
    const pth = "/" + p[1] + "/" + toolname + "/" + p.slice(3).join("/") + "#/y"
    return pth
  }
  const Seldiv = (props: {
    children: JSXElement,
    href: string
  }) => {
    const toolname = () => props.href.split("/")[2]
    const sel = () => toolname() == sitePage()?.toolname
    return <A href={props.href} class={`border-l-2 ${sel() ? "border-white" : "border-transparent"} h-8 w-12  text-center`}>
      {props.children}
    </A>
  }

  const bl = (fl: boolean) => fl ? "border-white" : "border-transparent"
  const ml = (e: string) => bl(e == sitePage()?.toolname)
  const Toolicons = () => {
    return <div class='w-14 flex-col flex mt-4 items-center space-y-6'>
      <Show when={!online()}>
        <RoundIcon class='text-red-500' path={signalSlash} />
      </Show>
      <For each={user.tools}>{(e, i) => {
        const tl = tools()[e]
        return <Switch>
          <Match when={e == "alert"}>
            <For each={user.alert}>
              {(e, i) => {
                // show avatar if available
                let href = setActiveTool("alert-" + i())
                return <Seldiv href={href} ><GraphicIcon class={bl(true)} count={count(i())} graphic={e.icon} color={e.color} onClick={() => nav(href)} /></Seldiv>
              }}
            </For>
          </Match>
          <Match when={e == "pindb"}>
            <For each={user.pindb}>{(e, i) => {
              // use database icon if available     
              return <RoundIcon path={pencil} onClick={() => nav("/" + e)} />
            }
            }
            </For>
          </Match>
          <Match when={e == "recentdb"}>
            <For each={user.recentdb}>{(e, i) => {
              // use database icon if available
              return <RoundIcon path={pencil} onClick={() => nav("/" + e)} />
            }}
            </For>
          </Match>
          <Match when={true}>
            <Show when={tl} fallback={<div>{e}</div>}>
              <Seldiv href={setActiveTool(e)}>{tl.icon()}</Seldiv>
            </Show>
          </Match>
        </Switch>
      }
      }</For>
      <DarkButton />
    </div>
  }

  const windowSize = createWindowSize();
  const left = () => {
    if (windowSize.width < 640) {
      return sitePage().flyout ? windowSize.width : 0
    } else return left_()
  }

  const HSplitterButton = () => {
    const mousedown = (e: MouseEvent) => {
      e.preventDefault()
      const start = e.clientX - left()
      const move = (e: MouseEvent) => {
        setLeft(e.clientX - start)
      }
      const up = (e: MouseEvent) => {
        window.removeEventListener("mousemove", move)
        window.removeEventListener("mouseup", up)
      }
      window.addEventListener("mousemove", move)
      window.addEventListener("mouseup", up)
    }
    return <div class={`fixed p-2  bg-neutral-900 rounded-tr-full rounded-br-full bottom-4 w-10 cursor-col-resize`} style={{
      left: left() + "px",
      "z-index": '900'
    }} onMouseDown={mousedown}>
      <Icon path={eastWest} class='h-6 w-6 text-neutral-500' /></div>
  }
  const MobileSearchButton = () => {

    // we can have our status buttons here too, jump directly to new messages
    return <div>
      <div class='fixed left-4 bottom-4'>
        <button onClick={() => { nav('/search') }}><Icon class='w-6 h-6' path={magnifyingGlass}></Icon></button>
      </div>
    </div>
  }

  return <SitePageContext.Provider value={sitePage()}>
    <Switch>
      <Match when={purl().tool.component}>   <HSplitterButton />
        <div class='flex h-screen w-screen fixed overflow-hidden'>
          <Show when={(windowSize.width > 640 || sitePage().flyout)}>
            <Toolicons />
            <div
              class='absolute dark:bg-gradient-to-r dark:from-black dark:to-neutral-900 overflow-hidden top-0 bottom-0'
              style={{
                left: "56px",
                width: left() - 56 + "px"
              }}
            >
              <div
                class='absolute overflow-auto top-0 left-0 right-0  '
                style={{
                  bottom: "0px",
                }}
              >
                <Suspense fallback={<div>waiting</div>}>
                  {purl().tool.component!()}
                </Suspense>


              </div>
              <div class=' hidden absolute bottom-0 left-0 right-0 h-16 bg-neutral-900'>
                <input placeholder='Send a message' />
              </div>
            </div>
          </Show>
          <div class='fixed' style={{
            left: (left()) + "px",
            right: "0px",
            top: "0px",
            bottom: "0px"
          }}>
            <ToolViewer />
            <InfoBox />
          </div>
        </div>
      </Match>
      <Match when={true}>
        <Switch>
          <Match when={windowSize.width < 640}>

            {/* this appears in mobile it mainly needs to activate search*/}
            <MobileSearchButton />

            <ToolViewer />
          </Match>
          <Match when={true}>
            <div class='flex h-screen w-screen fixed overflow-hidden'>
              <Toolicons />
              <ToolViewer />
            </div>
          </Match>
        </Switch>
      </Match>
    </Switch>
  </SitePageContext.Provider>

}
// <Splitter left={left} setLeft={setLeft}>
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

type IconPath = typeof history
type IconProps = { graphic: Graphic, class?: string, color?: string, count?: number, onClick?: () => void }

export function Svg(props: { src: string }) {
  return <div class='w-6 h-6' innerHTML={props.src}></div>
}


export function GraphicIcon(props: IconProps) {
  return <button onClick={props.onClick}>
    <div class={'relative ' + props.class ?? ""}>
      <div class='w-6 h-6 '>
        <Svg src={props.graphic.src}></Svg>
      </div>
      <Show when={props.count ?? 0 > 0}><span class="absolute right-0 top-0 block h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-white"></span></Show>
    </div></button>
}
export function FloatIcon(props: { path: IconPath, onClick?: () => void }) {
  return <button onClick={props.onClick}>
    <div ><Icon class='w-8 h-8' path={props.path}></Icon></div></button>
}
export function RoundIcon(props: { class?: string, path: IconPath, onClick?: () => void }) {
  return <button onClick={props.onClick}>
    <div ><Icon class={`w-6 h-6 ${props.class}`} path={props.path}></Icon></div></button>
}

export function Tooltip(props: { text: string, children: JSXElement }) {
  return <div class="mx-auto flex h-screen w-full items-center justify-center flex-col bg-gray-200 py-20">
    <div class="group relative cursor-pointer py-2">
      <div class="absolute invisible bottom-7 group-hover:visible w-40 bg-white text-black px-4 mb-3 py-2 text-sm rounded-md">
        <p class=" leading-2 text-gray-600 pt-2 pb-2"> {props.text}</p>
        <svg class="absolute z-10  bottom-[-10px] " width="16" height="10" viewBox="0 0 16 10" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 10L0 0L16 1.41326e-06L8 10Z" fill="white" />
        </svg>
      </div>
      <span class="underline hover:cursor-pointer">{props.children} </span>
    </div>
  </div>
}

/*
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

const [sitemap, setSitemap] = createSignal(ShowSitemap.adaptive)
export const [pagemap, setPagemap] = createSignal(ShowPagemap.adaptive)
// does it matter where the splitter is? we also need to derive that.

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
