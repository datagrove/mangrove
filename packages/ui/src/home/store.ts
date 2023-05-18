import { JSXElement } from "solid-js"

export interface SiteDefinition {
    title: string // = () => (<div class='flex justify-center items-center'><code>Datagrove</code></div>)
    root: SitePage //= { name: "/", path: "/", children: [] }  
    href: string // = "https://www.datagrove.com"
    sitemap: SitePage[] //= []
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
export interface SiteStore extends SiteDefinition {
    path: Map<string, SitePage> // = new Map()
    home?: SitePage
}
export interface Site {
    did: string
    name: string
    caps: Caps
}

export interface SitePage {
    doc: Document,
    toolname: string
    viewer: Viewer
    toolpane: Tool
}

export interface Document {
    site: Site
    path: string
    type: string
}
