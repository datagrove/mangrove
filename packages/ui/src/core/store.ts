import { JSXElement, createContext, createEffect, createSignal, useContext } from "solid-js"
import { orgsite } from "./site_menu_test";
import { createWs } from "./socket";
import { createWindowSize } from "@solid-primitives/resize-observer";

const windowSize = createWindowSize();
export const [online, setOnline] = createSignal(false)

export const [left, setLeft] = createSignal(350)
// layout state: split, allPanel, allContent. It's always manual if the screen is small
// panel states: none, partial, all
// the default depends on the screen size.
// if the screen is small then partial is always treated as all

export const mobile = () => windowSize.width < 640
export enum Layout {
  split,
  allPanel,  // always shows tools
  allContent
}
export const [layout, setLayout] = createSignal(windowSize.width > 640? Layout.split : Layout.allContent)

export const showPanel = () => layout() == Layout.split || layout() == Layout.allPanel
export const showContent = () => layout() == Layout.split || layout() == Layout.allContent
export const showTools = () => layout() == Layout.split || layout() == Layout.allPanel || !mobile()

// whenever the screen size changes, we may need to eliminate the split.
createEffect(() => {
  if (layout()==Layout.split && windowSize.width < 640) setLayout(Layout.allContent)
})

export const  menuToggle = () => {
  if (mobile()) {
    setLayout( layout()==Layout.allContent ? Layout.allPanel : Layout.allContent )
  } else {
    setLayout( layout()==Layout.split ? Layout.allContent : Layout.split )
  }
}

// login state kept in local storage
interface Login {
  did: string
}


// there is one more state? shouldn't we keep the tool icons as long as we are not mobile?
export const contentLeft = () => {
    switch(layout()) {
      case Layout.split: return left()
      case Layout.allPanel: return 0
      case Layout.allContent: return mobile()? 0 : 56
    }
}


export const [login, setLogin_] = createSignal(localStorage.getItem("login") as Login | null)
export function setCoreLogin(l: Login|null) {
  localStorage.setItem("login", JSON.stringify(l))
  setLogin_(l)
  if (l) getUser(l.did)
}

// user state cached in local database, update from cloud
const defaultUserSettings : UserSettings = {
  name: "",
  tools: [],
  pindm: [],
  pindb: [],
  recentdb: [],
  counters: {},
  watch: []
}
export const [userState, setUserState] = createSignal(defaultUserSettings)

export async function getUser(id: string) {
  console.log("getUser");
  setUserState( {
    tools: [
      //"home",
      "search",
      "edit",
      "dm",
      "watch",  // alerts can be any path, not just a folder with conversations
      "map",
      "account", // setting is similar to home database
      //"folder",
    ],
    name: "Anonymous",
    watch: standardAlerts,
    pindm: [],
    pindb: [],
    recentdb: [],
    counters: {
      "datagrove": 3
    }
  })
}

export const DocumentContext = createContext<SiteDocument>();
export const SitePageContext = createContext<SitePage>();
export const UserContext = createContext<UserSettings>();
export function useUser() { return useContext(UserContext) }

export function useDocument(): SiteDocument {
  const r = useContext(DocumentContext);
  if (!r) throw new Error("DocumentContext not found");
  return r
}
export function usePage(): SitePage {
  const r = useContext(SitePageContext);
  if (!r) throw new Error("SitePageContext not found");
  return r
}
export interface MenuEntry {
  parent?: MenuEntry
  name: string
  path?: string
  children?: MenuEntry[]
}
// export interface MenuDefinition {
//   title: string // = () => (<div class='flex justify-center items-center'><code>Datagrove</code></div>)
//   root: MenuEntry //= { name: "/", path: "/", children: [] }  
//   href: string // = "https://www.datagrove.com"
//   sitemap: MenuEntry[] //= []
//   defaultLanguage: string
//   language: {
//     [key: string]: string
//   } //= {}
// }
export interface Caps {
  read: boolean
  write: boolean
  admin: boolean
}

export interface Tool {
  global?: boolean  // a global tool does not have a path
  icon: () => JSXElement
  component?: () => JSXElement
  path: string
  viewer: () => JSXElement// pick a viewer the first time the tool is used, after that restore state for that tool (url)
}

export type Viewer = {
  default: () => JSXElement
  perspective?: {
    [key: string]: () => JSXElement
  }
}
// export interface SiteStore extends MenuDefinition {
//   path: Map<string, MenuEntry> // = new Map()
//   home?: MenuEntry
// }


export interface SitePage {
  server: string,    // we want this to be in url so it can be linked, but not necessarily host for the page
  path: string,
  tool: Tool,
  toolname: string,
}

export interface SiteDocumentRef {
  owner: string
  site: string   // if this is empty then we will use the server's default. if it doesn't begin with did: then we will assume its a unique name
  path: string
}


// we can construct the Sitemap from the Site
export interface Org {
  did: string
  displayName: string
}
// maybe instead of returning strings, we can return cells that we can use to watch these values and to update them
export interface Sitemap {
  menu: MenuEntry[]
  owner: Org   // we might have looked up a did
  DisplayName: string
  caps: Caps
}

// extend for various document types?
export interface SiteDocument {
  doc: SiteDocumentRef
  type: string
}

// this will find a previewable version of the document, maybe even compile one

// did or unique name?
// in general we allow partial databases, but not implemented yet.
export async function getSite(did: string): Promise<boolean> {
  const ws = createWs()
  const zip =  await ws.rpcj("getLive", did)
  // we want to merge the zip into a single sqlite database, that way we can search across sites (or not)


  return false
}
// each site must load its own custom service worker on its own domain.
// 
// it's not clear how we can dodge the cors issue though.
// we should probably use an offline site if we can, and get the whole offline site here if it's available.
// getLive needs to somehow package the references as well, is service worker the easiest way to do all this? maybe we need a service worker to do anything?

export async function getLive(id: SiteDocumentRef): Promise<boolean> {
  // we need to ask the database where we can find this document
  const st = await getSite(id.site)
  if (st) {

  } else {
    // we can try to view the site from the R2 bucket. (how?)

  }
  return true
}
export async function getDocument(path: string): Promise<SiteDocument> {
  // we need to ask the database where we can find this document
  const t = path.split("/").at(-1)
  return {
    doc: {
      owner: "",
      site: "",
      path: ""
    },
    type: t??""
  }
}
export interface Graphic {
  type: "text" | "svg"
  alt: string
  src: string
}

const heart: Graphic = {
  type: "svg",
  alt: "heart",
  src: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
  <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
</svg>
`
}

const business: Graphic = {
  type: "svg",
  alt: "business",
  src: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
  <path fill-rule="evenodd" d="M7.5 5.25a3 3 0 013-3h3a3 3 0 013 3v.205c.933.085 1.857.197 2.774.334 1.454.218 2.476 1.483 2.476 2.917v3.033c0 1.211-.734 2.352-1.936 2.752A24.726 24.726 0 0112 15.75c-2.73 0-5.357-.442-7.814-1.259-1.202-.4-1.936-1.541-1.936-2.752V8.706c0-1.434 1.022-2.7 2.476-2.917A48.814 48.814 0 017.5 5.455V5.25zm7.5 0v.09a49.488 49.488 0 00-6 0v-.09a1.5 1.5 0 011.5-1.5h3a1.5 1.5 0 011.5 1.5zm-3 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd" />
  <path d="M3 18.4v-2.796a4.3 4.3 0 00.713.31A26.226 26.226 0 0012 17.25c2.892 0 5.68-.468 8.287-1.335.252-.084.49-.189.713-.311V18.4c0 1.452-1.047 2.728-2.523 2.923-2.12.282-4.282.427-6.477.427a49.19 49.19 0 01-6.477-.427C4.047 21.128 3 19.852 3 18.4z" />
</svg>

`
}
const snooze: Graphic = {
  type: "svg",
  alt: "snooze",
  src: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
  <path fill-rule="evenodd" d="M12 2.25A6.75 6.75 0 005.25 9v.75a8.217 8.217 0 01-2.119 5.52.75.75 0 00.298 1.206c1.544.57 3.16.99 4.831 1.243a3.75 3.75 0 107.48 0 24.583 24.583 0 004.83-1.244.75.75 0 00.298-1.205 8.217 8.217 0 01-2.118-5.52V9A6.75 6.75 0 0012 2.25zM9.75 18c0-.034 0-.067.002-.1a25.05 25.05 0 004.496 0l.002.1a2.25 2.25 0 11-4.5 0zm.75-10.5a.75.75 0 000 1.5h1.599l-2.223 3.334A.75.75 0 0010.5 13.5h3a.75.75 0 000-1.5h-1.599l2.223-3.334A.75.75 0 0013.5 7.5h-3z" clip-rule="evenodd" />
</svg>

`
}

export interface Watch {
  path: string
  icon: Graphic
  color: string
  showNumber: boolean
  mute: number
}



// these could be emojis or svg, url for that?

// alerts are alertable paths, maybe sets of paths?
// alertable folders then?
// shows selected if the path matches in the url
const standardAlerts: Watch[] = [
  {
    path: "friend",
    icon: heart,
    color: "red",
    showNumber: false,
    mute: 0
  },
  {
    path: "business",
    icon: business,
    color: "blue",
    showNumber: true,
    mute: 0
  },
  {
    path: "watch",
    icon: snooze,
    color: "#888",
    showNumber: true,
    mute: 0
  },
]
export interface UserSettings {
  name: string
  tools: string[]
  pindm: string[]
  pindb: string[]
  recentdb: string[]
  counters: {
    [key: string]: number
  }
  watch: Watch[]
}




// export interface UserState {
//   settings: UserSettings,
//   counters: {
//     [key: string]: number
//   }
// }

// we need to get the user state before everything else, since it impacts the success of getting site and document
// user becomes a proxy, every field of user is reactive
// call once when we log in 



export async function getSitemap(p: SiteDocumentRef): Promise<Sitemap> {
  return {
    menu: orgsite.sitemap,
    owner: {
      displayName: "anonymous",
      did: "did:3:datagrove",
    },
    DisplayName: "Home of Anonymous",
    caps: {
      read: true,
      write: true,
      admin: true,
    }
  }
}

// resolved into dataurls? I'd rather not
export async function readAll(doc: string): Promise<string> {
  await new Promise(r => setTimeout(r, 2000));
  return "hello, world"
}
