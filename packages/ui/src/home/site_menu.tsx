
import { magnifyingGlass, xCircle, arrowDown, arrowUp, arrowLeft, star } from "solid-heroicons/outline"
import { Component, JSX, Match, Signal, Switch } from "solid-js"
import { CloseButton, Kbd } from "../core/buttons"
import { Collapsible, NavItem } from "./site_menu_section";
import { For } from "solid-js";
import { createWindowSize } from "@solid-primitives/resize-observer";
import { createEffect } from "solid-js";


import { Mdx } from "../layout/mdx";
import { PageParams } from "../layout/nav";
import { Icon } from "solid-heroicons"
import { chevronRight, sun, moon, cog_6Tooth as gear, language } from "solid-heroicons/solid"
import { createSignal, ParentComponent, Show } from "solid-js";

import { orgsite } from "./site_menu_test";
import { LanguageSelect } from "../i18n/i18";
import { useLocation, Location, useParams } from "../core/dg";
import { MenuDefinition, MenuEntry, SiteStore, usePage } from "./store";

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
export function setSite(s: MenuDefinition) {
  setSite2(prepSite(s))
}
// derived.
export const mobile = () => {
  const r = windowSize.width < 650
  //console.log("windowWidth", windowSize.width)
  return r
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
          </LanguageSelect></div><div class='flex-none'></div></div>
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


// computed things


export class BrowseState {
  // for each tab we need a most recent url visited
  recent: string[] = []
}


export function prepSite(sx: MenuDefinition): SiteStore {
  const s: SiteStore = {
    ...sx
    , path: new Map()
  }
  console.log("set site", s)

  const firstLeaf = (p: MenuEntry): MenuEntry => {
    if (p?.children) {
      return firstLeaf(p.children[0])
    }
    return p
  }
  // compile all the paths (not counting language) to a section or leaf.
  // note that we 
  const indexPaths = (o: MenuEntry, tab: number) => {
    if (o.path) {
      let lc = `/${tab}` + o.path
      // s.search.push({
      //   title: o.name.toLocaleLowerCase(),
      //   href: lc
      // })
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
  page: MenuEntry
  topSection: number
  loc: Location<any>
  //topTab: MenuEntry // () { return site.root.children![this.topSection] }
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
      //page: p!,
      topSection: ts,
      loc: loc,
      page: {
        name: "",
        path: undefined,
        children: undefined,
        parent: undefined
      }
    }
    console.log('page', loc, params, r)
    setPd(r)
  })


  return <div class='transform h-full flex-1 dark:bg-gradient-to-r dark:from-black dark:to-neutral-900'>
    <div class='pb-16 pt-2 px-2'>

      <div class='flex items-center'>
        <div class='flex-1 '><LearnCreate /></div>
      </div>

      <div class='mt-4'>
        <SectionNav page={pd()!} />
      </div>
    </div></div>
}

// {/* <SitePreference page={pd()!} />
// <SiteSearchButton /> */}
export function SectionNav(props: { page: PageDescription }) {
  // this needs be recursive, starting from the 
  const tabs = (): MenuEntry[] => {
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
function isLeafPage(page: MenuEntry): boolean {
  return page.children == null
}
// recursively build the sidbar menu
export function SectionsNavIterate(props: {
  pages: Array<MenuEntry>
  page: PageDescription // is this the top page?
}) {
  const location = useLocation();
  console.log("xx", props.pages, props.page)

  // pure accordian style collapses everything not a parent of the url
  // it might be friendlier to allow things to be left open
  const isCollapsed = (pages: MenuEntry) => {
    // return !pages.some((page) => {
    //   return isLeafPage(page) && location.pathname == page?.link;
    // });
    return false
  };

  return (
    <For each={props.pages}>
      {(subsection: MenuEntry) => (
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
// this isn't reflected into the url, links will always go to view first.

export const [isCreate, setIsCreate] = createSignal(false)
export const LearnCreate = () => {
  const sections = [
    "Learn",
    "Create",
  ]
  // this should always give us a lang?
  const i = () => isCreate() ? 1 : 0
  // maybe we should limit this to four some how? maybe we should adaptively change the representation (chips?) if we have too many.
  return (<div class="w-full mt-2 flex border border-solid-lightborder dark:border-solid-darkitem rounded-md"
  >    <For each={sections}>{(e, index) => (
    <a
      classList={{
        "bg-solid-light dark:bg-solid-dark font-semibold": index() == i(),
      }}
      class="flex-1 inline-flex w-full p-2 items-center justify-center whitespace-nowrap first:rounded-l-md border-r border-solid-lightborder dark:border-solid-darkitem hover:text-blue-500 hover:underline last:(rounded-r-md border-0)"
      onClick={() => setIsCreate(index() == 1)}
    >
      {e}
    </a>)
  }</For></div>)
}


/*
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

*/

