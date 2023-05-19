import { JSXElement, createContext, useContext } from "solid-js"
import { orgsite } from "./site_menu_test";
import { createStore } from "solid-js/store";

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
  icon: () => JSXElement
  component: () => JSXElement
  path: string  // pick a viewer the first time the tool is used, after that restore state for that tool (url)
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
  doc: SiteDocumentRef,
  toolname: string
  viewer: string
  flyout: string
}

export interface SiteDocumentRef {
  site: SiteRef
  path: string
}
export interface SiteRef {
  did?: string
  name?: string
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
  type: string
}

export async function getDocument(id: SiteDocumentRef): Promise<SiteDocument> {
  const t = id.path.split("/").slice(-1)[0]
  return {
    type: t
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

export interface Alert {
  icon: Graphic
  color: string
  showNumber: boolean
  mute: number
}



// these could be emojis or svg, url for that?
const standardAlerts: Alert[] = [
  {
    icon: heart,
    color: "red",
    showNumber: false,
    mute: 0
  },
  {
    icon: business,
    color: "blue",
    showNumber: true,
    mute: 0
  },
  {
    icon: snooze,
    color: "#888",
    showNumber: true,
    mute: 0
  },
]
export interface UserSettings {
  tools: string[]
  pindm: string[]
  pindb: string[]
  recentdb: string[]
  counters: {
    [key: string]: number
  }
  alert: Alert[]
}



// export interface UserState {
//   settings: UserSettings,
//   counters: {
//     [key: string]: number
//   }
// }

// we need to get the user state before everything else, since it impacts the success of getting site and document
// user becomes a proxy, every field of user is reactive

export async function getUser(id: string): Promise<UserSettings> {
  console.log("getUser");
  return {
    tools: [
      "alert",
      "dm",
      "menu",
      "ai",
      "search",
      "history",
      "pindb",
      "settings", // setting is similar to home database
    ],
    alert: standardAlerts,
    pindm: [],
    pindb: [],
    recentdb: [],
    counters: {
      "datagrove": 3
    }
  }
}


export async function getSitemap(p: SiteRef): Promise<Sitemap> {
  return {
    menu: orgsite.sitemap,
    owner: {
      displayName: "Datagrove",
      did: "did:3:datagrove",
    },
    DisplayName: "CS Lewis Notes",
    caps: {
      read: true,
      write: true,
      admin: true,
    }
  }
}

// resolved into dataurls? I'd rather not
export async function readAll(doc: SiteDocument): Promise<string> {
  await new Promise(r => setTimeout(r, 2000));
  return "hello, world"
}
