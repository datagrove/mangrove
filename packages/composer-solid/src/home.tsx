

import { For, JSXElement, Match, Show, Suspense, Switch } from "solid-js";
import { A, useLocation } from "@solidjs/router";

import { Icon, } from "solid-heroicons";
import { signalSlash, clock as history, plusCircle } from "solid-heroicons/solid";
import { DarkButton } from "../../ui-solid/src";
import { Graphic, SitePage, SitePageContext, left, login, online, setLeft, showPanel, userState, contentRight } from "../../ui-solid/src/core";
import { DropModal, NewModal, PickGroupModal, pickNewFile } from "./new";

//import { Db, createDb } from "../db";
import { HSplitterButton } from "../../ui-solid/src/splitter";
import { useDg } from "../../datagrove/src";

const debug = false

/*
  createEffect(async () => {
    // this will happen after mounting, but not before the database is ready.
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
*/

interface ComposerProps {
  tools: any
}

export const Composer = (propb: ComposerProps) => {
  const dg = useDg()
  const loc = useLocation()

  let el: HTMLDivElement


  // provide is things we can get sync, no fetch
  // this value is for useSitePage()
  // note we need the type of the content to be part of the url, so we know what it is before we fetch it.
  // this is often done with extensions, but there is no difference
  const sitePage = () => {
    const p = loc.pathname.split("/")
    // [0] is empty,  [1] is ln
    const name = p[2] ?? "search"
    let ft = propb.tools[name] ??  propb.tools["search"]
    const r: SitePage = {
      server: '', // default server, need a syntax for different ones, including webrtc ones.
      tool: ft,
      path: p.slice(3).join("/"),  // site/
      toolname: name
    }
    return r
  }

  // old way, not used; give the content pane to the tool
  const ToolViewer: () => JSXElement = () => {
    return <>
      {false && <pre>{JSON.stringify({
        login: login(),
        state: userState()
      }, null, 2)}</pre>}
      {sitePage() && sitePage().tool.viewer()}
    </>
  }

  // we can get page information out of the location or the context. 
  // before we had the site page pick a tool based on the tool in the path. now the tool is out of the path and we set the viewer based on the content of the page. the service worker is always going to send html as the mime type, 
  // note that now the toolset will be picked by the content of the page.
  const PageViewer: () => JSXElement = () => {
    return <>
           {sitePage() && sitePage().tool.viewer()}
    </>
  }

  const count = (i: number) => { return i == 1 ? 2 : 0 }

  // return a link that activates the tool, and may set the path.
  // some links in the tool pane are only active if the path matches as well.


  // should include set active tool in this?
  const Seldiv = (props: {
    children: JSXElement,
    toolname: string,
    path?: string
  }) => {

    const p = () =>loc.pathname.split("/").slice(3).join("/")
    const href = () => "/" + "en" + "/" + props.toolname + (props.path ? "/" + props.path : "")
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

  const newFile = async () => {
    const r = await pickNewFile()
  }

  // if they share things, then discussions will go with that.
  const watch = () => {
    return <For each={userState().watch}>
      {(e, i) => {
        return <Seldiv toolname='watch' path={e.path} ><GraphicIcon class={bl(true)} count={count(i())} graphic={e.icon} color={e.color} /></Seldiv>
      }}
    </For>
  }

  const Toolicons = () => {
    return <div class='w-14 flex-col flex mt-4 items-center space-y-6'>
      <RoundIcon path={plusCircle} onClick={newFile} />
      <For each={userState().tools}>{(e, i) => {
        const tl = propb.tools[e]
        return <Switch>

          <Match when={true}>
            <Show when={tl} fallback={<div>{e}</div>}>
              <Seldiv toolname={e}>{tl.icon()}</Seldiv>
            </Show>
          </Match>
        </Switch>
      }
      }</For>
      <Show when={debug} >
        <DarkButton />
      </Show>
      <Show when={!online()}>
        <RoundIcon class='text-red-500' path={signalSlash} />
      </Show>
    </div>
  }

   const ToolPane = () => {
    return    <>
          <Toolicons />       <div
      class='absolute  dark:bg-gradient-to-r dark:from-black dark:to-neutral-900 overflow-hidden top-0 bottom-0'
      style={{
        left: "56px",
        right: "0px",
      }}
    >
      <div
        class='h-full w-full overflow-auto top-0 left-0 right-0  '
        style={{
          bottom: "0px",
        }}
      >
        <Suspense fallback={<div>waiting</div>}>
          {sitePage().tool.component!()}
        </Suspense>
      </div>

    </div>
    </>
  }


  return <>
    <SitePageContext.Provider value={sitePage()}>
      <NewModal />
      <DropModal />
      <PickGroupModal />
      <div ref={el!} class='flex h-screen w-screen fixed overflow-hidden'>
                <div class='fixed' style={{
          left: "0px",
          right: contentRight() + "px",
          top: "0px",
          bottom: "0px"
        }}>
          <PageViewer />
        </div>
        
        <Show when={showPanel()}>
          <HSplitterButton style={{
            "z-index": 10000,
            left: left() + "px"
          }} class='h-full w-1.5 absolute hover:bg-blue-500 hover:opacity-100 bg-blue-700 opacity-0 cursor-ns-resize' value={left} setValue={setLeft} />
           <div class='fixed' style={{
              left: left() + "px",
              right: "0px",
              top: "0px",
              bottom: "0px"
            }}>
          
          <ToolPane />
          </div>

        </Show>

      </div>

    </SitePageContext.Provider></>

}
// <Splitter left={left} setLeft={setLeft}>
// potentially a table of contents for current page

// controlled by the mounting app?


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

// show green bubble if count > 0
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

