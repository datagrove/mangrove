import { JSXElement, createContext, useContext } from "solid-js"

export const PageContext = createContext<SitePage>();
export function usePage() { return useContext(PageContext); }

export interface MenuEntry {
  parent?: MenuEntry
  name: string
  path?: string
  children?: MenuEntry[]
}
export interface MenuDefinition {
  title: string // = () => (<div class='flex justify-center items-center'><code>Datagrove</code></div>)
  root: MenuEntry //= { name: "/", path: "/", children: [] }  
  href: string // = "https://www.datagrove.com"
  sitemap: MenuEntry[] //= []
  defaultLanguage: string
  language: {
    [key: string]: string
  } //= {}
}
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
export interface SiteStore extends MenuDefinition {
  path: Map<string, MenuEntry> // = new Map()
  home?: MenuEntry
}
export interface Site {
  did: string
  name: string
  caps: Caps
}

export interface SitePage {
  doc: SiteDocument,
  toolname: string
  viewer: Viewer
  toolpane: Tool
}

export interface SiteDocument {
  site: Site
  path: string
  type: string
}
