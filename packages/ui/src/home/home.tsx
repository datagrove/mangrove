

import { For, JSXElement, Match, Show, Suspense, Switch, createContext, createEffect, createResource, createSignal, useContext } from "solid-js";
import { createWs } from "../core/socket";
import { A, useLocation } from "@solidjs/router";
import { useLn } from "../login/passkey_i18n";

import { Icon, } from "solid-heroicons";
import { signalSlash, bars_3 as menu, user as avatar, clock as history, pencil, chatBubbleBottomCenter as friend, magnifyingGlass, map, plusCircle , circleStack} from "solid-heroicons/solid";
import { ChatPanel, ChatViewer, DatabaseTool, DatabaseViewer } from "./viewer";
import { SettingsViewer } from "./settings";
import { DarkButton } from "../lib";
import { SearchPanel, SearchViewer } from "./search";
import { Settings } from "./settings";
import { Graphic, SitePage, SitePageContext, Tool, contentLeft, left, login, menuToggle, mobile, online, setLeft, showPanel, showTools, useUser, userState } from "../core";
import { EditTool, EditViewer } from "./edit";
import { MapTool, MapViewer } from "./map";
import { DropModal, NewModal, PickGroupModal, pickNewFile, uploadFiles } from "./new";

//import { Db, createDb } from "../db";
import { HSplitterButton } from "./viewer/splitter";
import { TabState, useDg } from "../mvr";

const builtinTools: { [key: string]: Tool } = {
  "edit": {
    icon: () => <FloatIcon path={pencil} />,
    component: EditTool,
    path: 'a/b/text',
    viewer: EditViewer
  },
  // message home
  // Message component is also used for the alerts - how?
  "dm": {
    icon: () => <FloatIcon path={friend} />,
    component: () => <ChatPanel />,
    path: 'a/b/chat',
    viewer: ChatViewer
  },
  "watch": {
    icon: () => <FloatIcon path={friend} />,
    component: () => <ChatPanel />,
    path: 'a/b/chat',
    viewer: ChatViewer
  },
  "account": {
    icon: () => <FloatIcon path={avatar} />,
    component: Settings,
    path: 'a/b/form',
    viewer: SettingsViewer
  },
  "search": {
    icon: () => <FloatIcon path={magnifyingGlass} />,
    component: SearchPanel,
    path: 'a/b/folder',
    viewer: SearchViewer
  },
  "map": {
    icon: () => <FloatIcon path={map} />,
    component: MapTool,
    path: 'a/b/text',
    viewer: MapViewer
  },
  "db": {
    icon: () => <FloatIcon path={circleStack} />,
    component: DatabaseTool,
    path: 'a/b/text',
    viewer: DatabaseViewer
  },
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

// take flyout out of url? the argument for it in, is that we can bookmark it, send a link to it,. Out will leave as at the actual page though, and is more conventional.
    // owner / ln / branch / db  / viewpath  


export function LoggedIn() {

  // pause here until we have a database
  return <TabState >
    <LoggedIn2 />
    </TabState>

}
export function LoggedIn2() {
  const db = useDg()!
  const ws = createWs()
  const loc = useLocation()
  const ln = useLn()

  let el : HTMLDivElement

  createEffect(async () => {
    // this will happen after mounting, but not necessarily before the database is ready.
    if (db) {
      el.addEventListener('dragover', (event) => {
        event.preventDefault();
      });

      el.addEventListener('drop', (event) => {
        event.preventDefault();
        const files = event.dataTransfer?.files;
        if (files) {
          // Handle dropped files here
          // start the new dialog, with files alread prepped.
          //const group = db!.recentGroup(1)
          uploadFiles(files)
        }
      });
    }
  })

  // page is things we can get sync, no fetch
  const sitePage = () => {
      const p = loc.pathname.split("/")
      // [0] is empty,  [1] is ln
      const name = p[2]??"search"
      let ft = tools()[name]??tools()["search"]
      const r: SitePage =   {
        server: '', // default server, need a syntax for different ones, including webrtc ones.
        tool: ft,
        path: p.slice(3).join("/"),
        toolname: name
      }
      return r
  }

  const ToolViewer : () => JSXElement = () => {
    return <>
      {false &&<pre>{JSON.stringify({
        login: login(),
        state: userState()
      },null,2)}</pre>}
      {sitePage()&&sitePage().tool.viewer()}
      </>
  }

  // const nav = (path: string) => {
  //   onav("/"+ln().ln +"/" + path )
  // }
  // how do we display counters? how do we update them?
  // when does clicking a tool change the viewer? always?

  // sets the left of the main content, 

  const count = (i: number) => { return i == 1 ? 2 : 0 }

  // return a link that activates the tool, and may set the path.
  // some links in the tool pane are only active if the path matches as well.

 
  // should include set active tool in this?
  const Seldiv = (props: {
    children: JSXElement,
    toolname: string,
    path?: string
  }) => {
    
    const p = ()=>loc.pathname.split("/").slice(3).join("/")
    const href = () => "/" + ln().ln + "/" + props.toolname + (props.path?"/"+props.path:"")
    const sel = () => {
      if (props.path) {
        return props.toolname == sitePage()?.toolname && props.path == p()
      } else {
        return props.toolname == sitePage()?.toolname
      }
    }
    return <A href={href()} class={`border-l-2 ${sel() ? "border-white" : "border-transparent"} h-8 w-12  text-center`}>
      {props.children}
    </A>
  }

  const bl = (fl: boolean) => fl ? "border-white" : "border-transparent"
  // if we click on a selected tool, then we should always change the layout from content to split
  // or split to content
  // or maybe we should do what gmail does and just show a hamburger for that.

  const newFile = async() => {
    const r = await pickNewFile()
  }

  const Toolicons = () => {
    return <div class='w-14 flex-col flex mt-4 items-center space-y-6'>
      <RoundIcon path={menu} onClick={menuToggle} />
      <RoundIcon path={plusCircle} onClick={newFile} />
      <For each={userState().tools}>{(e, i) => {
        const tl = tools()[e]
        return <Switch>
          <Match when={e == "watch"}>
            <For each={userState().watch}>
              {(e, i) => {
                // show avatar if available

                return <Seldiv toolname='watch' path={e.path} ><GraphicIcon class={bl(true)} count={count(i())} graphic={e.icon} color={e.color} /></Seldiv>
              }}
            </For>
          </Match>
          <Match when={true}>
            <Show when={tl} fallback={<div>{e}</div>}>
              <Seldiv toolname={e}>{tl.icon()}</Seldiv>
            </Show>
          </Match>
        </Switch>
      }
      }</For>
      <DarkButton />
      <Show when={!online()}>
        <RoundIcon class='text-red-500' path={signalSlash} />
      </Show>
    </div>
  }

  // const HSplitterButton = () => {
  //   const mousedown = (e: MouseEvent) => {
  //     e.preventDefault()
  //     const start = e.clientX - left()
  //     const move = (e: MouseEvent) => {
  //       setLeft(e.clientX - start)
  //     }
  //     const up = (e: MouseEvent) => {
  //       window.removeEventListener("mousemove", move)
  //       window.removeEventListener("mouseup", up)
  //     }
  //     window.addEventListener("mousemove", move)
  //     window.addEventListener("mouseup", up)
  //   }
  //   return <div class={`fixed p-2  bg-neutral-900 rounded-tr-full rounded-br-full bottom-4 w-10 cursor-col-resize`} style={{
  //     left: left()-56 + "px",
  //     "z-index": '900'
  //   }} onMouseDown={mousedown}>
  //     <Icon path={eastWest} class='h-6 w-6 text-neutral-500' /></div>
  // }
  // how this is shown may depend on the tool
  const MobileSearchButton = () => {
    // we can have our status buttons here too, jump directly to new messages
    return <div>
      <div class='fixed left-4 bottom-4'>
        <Seldiv toolname='search'><Icon class='w-6 h-6' path={magnifyingGlass}></Icon></Seldiv>
      </div>
    </div>
  }
  return <>
    <SitePageContext.Provider value={sitePage()}>
    <NewModal/>
    <DropModal/>
    <PickGroupModal/>
    <Switch>
      <Match when={sitePage().tool.component}>  
        <div ref={el!} class='flex h-screen w-screen fixed overflow-hidden'>
          <Show when={showTools()}>
            <Toolicons />
          </Show>
          <Show when={showPanel()}>
          <HSplitterButton style={{
            "z-index": 10000,
            left: left()+"px"
        }} class='h-full w-1.5 absolute hover:bg-blue-500 hover:opacity-100 bg-blue-700 opacity-0 cursor-ns-resize' value={left} setValue={setLeft}/>

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
                  {sitePage().tool.component!()}
                </Suspense>
              </div>
            </div>
          </Show>
          <div class='fixed' style={{
            left: (contentLeft()) + "px",
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
        <Match when={mobile()}>
            {/* this appears in mobile it mainly needs to activate search*/}
            <MobileSearchButton/>
          
          <ToolViewer/>
        </Match>
        <Match when={true}>
          <div class='flex h-screen w-screen fixed overflow-hidden'>
          <Toolicons/>
          <ToolViewer/>
          </div>
          </Match>
        </Switch>
      </Match>
    </Switch>
  </SitePageContext.Provider></>

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
