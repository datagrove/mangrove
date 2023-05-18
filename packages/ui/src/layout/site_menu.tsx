
import { magnifyingGlass, xCircle, arrowDown, arrowUp, arrowLeft, star } from "solid-heroicons/outline"
import { Component, JSX, Match, Switch } from "solid-js"
import { CloseButton, Kbd } from "../core/buttons"
import { Collapsible, NavItem } from "./section";
import { For } from "solid-js";
import { createWindowSize } from "@solid-primitives/resize-observer";
import { createEffect } from "solid-js";


import { Mdx } from "./mdx";
import { PageParams } from "./nav";
import { Icon } from "solid-heroicons"
import { chevronRight, sun, moon, cog_6Tooth as gear, language } from "solid-heroicons/solid"
import { createSignal, ParentComponent, Show } from "solid-js";

import { orgsite } from "./orgsite";
import { LanguageSelect } from "../i18n/i18";
import { useLocation, Location, useParams } from "../core/dg";
import { usePage } from "../home";

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

export const [searchMode, setSearchMode] = createSignal(false)
export const [innerContent, setInnerContent] = createSignal(<div />)
// orgsite is a test value
export const [site, setSite2] = createSignal<SiteStore>(prepSite(orgsite));
const [sitemap, setSitemap] = createSignal(ShowSitemap.adaptive)
export const [pagemap, setPagemap] = createSignal(ShowPagemap.adaptive)
const [isDark, setIsDark] = createSignal(true)
export const windowSize = createWindowSize();

// derived.
export const mobile = () => {
  const r = windowSize.width < 650
  //console.log("windowWidth", windowSize.width)
  return r
}

export const DarkButton = () => {
  return (<button
    type="button"
    aria-label={`Use ${isDark() ? "light" : "dark"} mode`}
    onClick={() => {
      const html = document.querySelector("html")!
      setIsDark(!isDark())
      isDark()
        ? html.classList.add("dark")
        : html.classList.remove("dark");
    }}>

    <Show
      when={isDark()}
      fallback={<Icon path={moon} class="w-6 h-6"></Icon>}
    >
      <Icon path={sun} class="w-6 h-6"></Icon>
    </Show>
  </button>)
}

// language selector
export const SitePreference = (props: { page: PageDescription }) => {
  const [collapsed, setCollapsed] = createSignal(true);

  return (
    <div class="mt-2 border border-solid-lightitem bg-solid-light dark:bg-solid-dark dark:border-solid-darkitem rounded-lg">
      <button
        onClick={() => setCollapsed((prev) => !prev)}
        aria-controls="preferences"
        type="button"
        class="flex items-center justify-between p-2 w-full cursor-pointer"
      >
        <div class="flex items-center gap-2 font-semibold">
          <div class="bg-solid-lightitem dark:bg-solid-darkitem rounded-lg p-1">
            <Icon path={gear} class="w-4 h-4" />
          </div>
          Preferences
        </div>
        <Icon path={chevronRight}
          class={`w-6 h-6 text-solid-lightaction dark:text-solid-darkaction transform transition ${!collapsed() ? "rotate-90" : ""
            }`}
        />
      </button>
      <Show when={!collapsed()}>
        <div aria-label="preferences" class="p-4 border-t border-solid-lightitem dark:border-solid-darkitem">

          <div class='flex items-center'><div class='flex-1'><LanguageSelect>
            <Icon class='h-5 w-5' path={language} />
          </LanguageSelect></div><div class='flex-none'><DarkButton /></div></div>
          <div class='flex'><div class='flex-1'></div></div>
        </div>
      </Show>
    </div>
  );
}



// Section[1-6] / page

// the top tabs are special because they define a navigation state.
// we could remember this state even going to another site and back.

// note that the link here is only informally related to the path?
// is that how we should do it? what if we went the other way?
// the path of the file we are displaying is unique, we could use that for the route
// and look up the location in the menu.
// we could also invent a new id altogether, which would have the advantage of 
// being stable? astro uses the reverse lookup approach; the organization of the files
// decides the url.

// all the bits of info we can get from the route
// we can keep cache of languages.

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
// computed things
export interface SiteStore extends SiteDefinition {
  path: Map<string, SitePage> // = new Map()
  home?: SitePage
  search: SearchResult[] // = []
}

export type SitePage = {
  name: string
  path?: string
  children?: SitePage[]
  parent?: SitePage
};
export class BrowseState {
  // for each tab we need a most recent url visited
  recent: string[] = []
}


export interface SearchResult {
  title: string
  href: string
  favorite?: boolean
}

export const [favorites, setFavorites] = createSignal<SearchResult[]>([
  // { title: "fav1", href: "xx" }
])
export const [recent, setRecent] = createSignal<SearchResult[]>([
  // { title: "recent1", href: "xx" }
])

// move from recent to favorite
export function addFavorite(x: number) {
  setFavorites([removeRecent(x), ...favorites()])
}
// remove from favorite
export function removeFavorite(x: number) {
  const y = favorites()
  y.splice(x, 1)
  setFavorites(y)
}
export function removeRecent(x: number) {
  const y = recent()
  const o = y.splice(x, 1)[0]
  setRecent(y)
  return o
}
export function addRecent(x: SearchResult) {
  setRecent([x, ...recent()])
}
export function fetchResults(site: SiteStore, sp: string): SearchResult[] {
  if (sp.length == 0) {
    return []
  }
  sp = sp.toLowerCase()
  const a = site.search.filter((e) => e.title.indexOf(sp) != -1)
  return a
}
export function setSite(s: SiteDefinition) {
  setSite2(prepSite(s))
}

export function prepSite(sx: SiteDefinition): SiteStore {
  const s: SiteStore = {
    ...sx
    , path: new Map()
    , search: []
  }
  console.log("set site", s)

  const firstLeaf = (p: SitePage): SitePage => {
    if (p?.children) {
      return firstLeaf(p.children[0])
    }
    return p
  }
  // compile all the paths (not counting language) to a section or leaf.
  // note that we 
  const indexPaths = (o: SitePage, tab: number) => {
    if (o.path) {
      let lc = `/${tab}` + o.path
      s.search.push({
        title: o.name.toLocaleLowerCase(),
        href: lc
      })
      s.path.set(lc, o)
    }
    for (let ch of o.children ?? []) {
      // is this a problem? it's not clear how we would do it otherwise
      // note that flutter for deep links often builds a stack of widgets, but web doesn't. we are only using this to get a reasonable configuration of the menu expansions
      ch.parent = ch.parent ?? o
      indexPaths(ch, tab)
    }
  }
  s.root = { name: '/', children: s.sitemap }
  s.home = s.home ?? firstLeaf(s.root);
  for (let i = 0; i < s.root.children!.length; i++)
    indexPaths(s.root.children![i], i)
  return s
}


// what are the transitions?
// none -> adaptive | overlay depending on sitemap and 


// does it matter where the splitter is? we also need to derive that.
export const showSitemap = (): ShowSitemap => {
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


export interface PageDescription {
  site: SiteStore
  param: PageParams
  lang: string
  page: SitePage
  topSection: number
  loc: Location<any>
  //topTab: SitePage // () { return site.root.children![this.topSection] }
}
// we need to build based on the route
// everything can scroll off; maximum use of space. easy to find top anyway.
// we probably need a sticky to close? maybe this can be done with the rail though
export const SiteMenuContent: Component<{}> = (props) => {
  const st = usePage()
  const [pd, setPd] = createSignal<PageDescription>()

  createEffect(() => {
    const loc = useLocation<Location>()
    const params = useParams<PageParams>()

    // a derivative of a location change. May require subscribing to the database
    const s = site()
    if (!s) {
      return undefined
    }
    const h = loc.hash
    const ts = loc.hash == "#1" ? 1 : 0
    params.ln ?? 'en'
    const p = s.path.get(params.path ?? "") ?? s.home
    const r: PageDescription = {
      site: s,
      param: params,
      lang: "",
      page: p!,
      topSection: ts,
      loc: loc,
    }
    console.log('page', loc, params, r)
    setPd(r)
  })


  return <div class='transform h-full flex-1 dark:bg-gradient-to-r dark:from-black dark:to-neutral-900'><Switch>
    <Match when={!pd()}>
      Error
    </Match>
    <Match when={searchMode()}>
      <SearchList />
    </Match>
    <Match when={!searchMode()}>
      <div class='pb-16 pt-2 px-2'>
        {pd()!.site.title}
        <div class='flex items-center'>
          <div class='flex-1 '><SiteTabs page={pd()!} /></div>
        </div>

        <div class='mt-4'>
          <SectionNav page={pd()!} />
        </div>
      </div></Match>
  </Switch></div>
}

// {/* <SitePreference page={pd()!} />
// <SiteSearchButton /> */}
export function SectionNav(props: { page: PageDescription }) {
  // this needs be recursive, starting from the 
  const tabs = (): SitePage[] => {
    return (props.page.site.root.children![props.page.topSection].children) ?? []
  }
  return (
    <ul class="flex flex-col gap-4">
      <For each={tabs()}>
        {(page, i) => (
          <>
            <li>
              <h2 class="pl-2 text-solid-dark dark:text-white font-bold text-xl">
                {page.name}
              </h2>
              <SectionsNavIterate page={props.page} pages={page.children ?? []} />
            </li>
          </>
        )}
      </For>
    </ul>
  );
}
function isLeafPage(page: SitePage): boolean {
  return page.children == null
}
// recursively build the sidbar menu
export function SectionsNavIterate(props: {
  pages: Array<SitePage>
  page: PageDescription // is this the top page?
}) {
  const location = useLocation();
  console.log("xx", props.pages, props.page)

  // pure accordian style collapses everything not a parent of the url
  // it might be friendlier to allow things to be left open
  const isCollapsed = (pages: SitePage) => {
    // return !pages.some((page) => {
    //   return isLeafPage(page) && location.pathname == page?.link;
    // });
    return false
  };

  return (
    <For each={props.pages}>
      {(subsection: SitePage) => (
        <>
          <Show when={isLeafPage(subsection)}>
            <NavItem
              href={"/" + props.page.lang + `/${props.page.topSection}` + subsection.path ?? ""}
              title={subsection.name}
            >
              {subsection.name}
            </NavItem>
          </Show>
          <Show when={subsection.children}>
            <ul>
              <Collapsible
                header={subsection.name}
                startCollapsed={isCollapsed(subsection)}
              >
                <SectionsNavIterate
                  pages={subsection.children ?? []}
                  page={props.page}
                />
              </Collapsible>
            </ul>
          </Show>
        </>
      )}
    </For>
  );
}



// when we click a top tab, it should adjust the page being viewed; each tab maintains a router state. For example you should be able to go to a reference section without losing your place in the tutorial.
// if there is no prior state, we need to default to first page
export const SiteTabs = (props: { page: PageDescription }) => {
  const sections = () => props.page.site.root.children
  // this should always give us a lang?

  // maybe we should limit this to four some how? maybe we should adaptively change the representation (chips?) if we have too many.
  return (<div class="w-full mt-2 flex border border-solid-lightborder dark:border-solid-darkitem rounded-md"
  >    <For each={sections()}>{(e, index) => (
    <a
      classList={{
        "bg-solid-light dark:bg-solid-dark font-semibold": index() == props.page.topSection,
      }}
      class="flex-1 inline-flex w-full p-2 items-center justify-center whitespace-nowrap first:rounded-l-md border-r border-solid-lightborder dark:border-solid-darkitem hover:text-blue-500 hover:underline last:(rounded-r-md border-0)"
      href={"#" + index()}
    >
      {e.name}
    </a>)
  }</For></div>)
}




// search as nav. maintains site state for favorites and recents.
export function SiteSearchButton() {
  return (
    <button class=' flex mt-2 mb-2 p-2 w-full border-solid-lightitem dark:border-solid-darkitem border rounded-md dark:bg-solid-dark'
      onclick={() => {
        console.log("search")
        setSearchMode(true)
      }}
    >
      <Magnifier />
      <input readonly
        class=" flex-1 focus:outline-none dark:bg-solid-dark"
        placeholder="Search" type="search" />
      <Kbd>⌘</Kbd>
      <Kbd>K</Kbd>
    </button>
  )
}

export const Magnifier = () => <Icon class="mr-2  h-5 w-5 flex-none text-neutral-500" path={magnifyingGlass} />


const [result, setResult] = createSignal<SearchResult[]>([])

export const SearchBox = () => {
  const s = site()
  const fn = (e: InputEvent) => {
    const p = (e.currentTarget as HTMLInputElement).value
    console.log("search", p)
    setResult(fetchResults(s!, p))
  }
  return (<div class='w-full p-2'><div class=' flex p-2 w-full border-solid-lightitem dark:border-solid-darkitem border rounded-md dark:bg-solid-dark'
    onclick={() => {
      console.log("search")
      setSearchMode(true)
    }}
  >
    <Magnifier />
    <input autofocus
      class=" flex-1 focus:outline-none dark:bg-solid-dark"
      placeholder="Search" type="search" onInput={fn} /></div></div>)
}

// when we click a search it goes to recent. In recent we can star it to go to favorites. In favorites we can X it to delete it.

export const FavoriteLink: Component<{
  result: SearchResult
  index: number
}> = (props) => {
  const deleteme = () => { removeFavorite(props.index) }
  return <div class='w-full hover:bg-blue-500 rounded-r-lg p-2 flex'>
    <a class='flex-1' href={props.result.href}>{props.result.title}</a>
    <button title={props.result.title} type='button' onclick={deleteme} class='text-neutral-500 hover:text-black dark:hover:text-white'><Icon class='h-6 w-6' path={xCircle}></Icon></button>
  </div>
}

export const RecentLink: Component<{
  result: SearchResult
  index: number
}> = (props) => {
  const starme = () => { addFavorite(props.index) }
  const deleteme = () => { removeRecent(props.index) }
  return <div class='w-full hover:bg-blue-500 rounded-r-lg p-2 flex'>
    <a class='flex-1' href={props.result.href}>{props.result.title}</a>
    <button title={props.result.title} type='button' onclick={starme} class='mx-2 text-neutral-500 hover:text-black dark:hover:text-white'><Icon class='h-6 w-6' path={star}></Icon></button>
    <button title={props.result.title} type='button' onclick={deleteme} class='text-neutral-500 hover:text-black dark:hover:text-white'><Icon class='h-6 w-6' path={xCircle}></Icon></button>
  </div>
}

export const SearchLink: Component<{
  result: SearchResult
}> = (props) => {
  const clickme = () => {
    addRecent(props.result)
    location.href = props.result.href
    setSearchMode(false)
  }
  return (<div class='pr-2'>
    <div class='w-full hover:bg-blue-500 rounded-r-lg p-2 flex'>
      <a onclick={clickme} class='flex-1 mx-2'> {props.result.title}</a>
    </div>
  </div>)
}



export const SearchList = () => {

  return (<div class='h-full w-full flex flex-col'>
    <SearchBox />
    <div class='flex-1 overflow-auto'>

      <Switch>
        <Match when={result().length}>
          <For each={result()}>{(e, index) =>
            <SearchLink result={e} />
          }</For>
        </Match>
        <Match when={true}>
          <Show when={recent().length}>
            <div class="w-full uppercase m-2 text-solid-dark dark:text-solid-light text-left relative flex items-center justify-between py-2">Recent</div>
            <For each={recent()}>{(e, index) =>
              <RecentLink result={e} index={index()} />
            }</For>
          </Show>
          <Show when={favorites().length}>
            <div class="w-full m-2 uppercase text-solid-dark dark:text-solid-light text-left relative flex items-center justify-between py-2 flex-1">Favorites</div><For each={favorites()}>{(e, index) =>
              <FavoriteLink result={e} index={index()} />
            }</For>

          </Show>
        </Match>
      </Switch>

    </div>
    <div class='text-sm text-neutral-500 flex items-center'>
      <Kbd><Icon path={arrowLeft} /></Kbd> to select
      <Kbd><Icon path={arrowUp} /></Kbd><Kbd><Icon path={arrowDown} /></Kbd> to navigate <Kbd>Esc</Kbd> to close</div>
  </div>)
}

