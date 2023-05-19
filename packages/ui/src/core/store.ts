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

export interface UserSettings {
  tools: string[]
  pindm: string[]
  pindb: string[]
  recentdb: string[]
  counters: {
    [key: string]: number
  }
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
      "menu",
      "search",
      "dm",

      "pindm",
      "pindb",
      "settings", // setting is similar to home database
    ],
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