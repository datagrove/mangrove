

import { Collapsible, NavItem } from "./site_menu_section";
import { createSignal, Show, For, Component, createEffect, Signal, createResource, Suspense } from "solid-js";
import { useLocation, Location, useParams } from "../core/dg";
import { Ab } from "../layout/nav";
import { MenuEntry, getSitemap, usePage } from "../core";



const editSection = [
  {

    name: "Collaborate",
    children: [
      {
        name: "Publish",
        link: "/settings",
      },
      {
        name: "Discuss",
        link: "/settings",
      },
      {
        name: "Share",
        link: "/settings",
      },
      {
        name: "Start a proposal",
        link: "/settings",
      },
    ]
  },
  {
    name: "Compose",
    children: [
      {
        name: "Add or delete packages",
        link: "/settings",
      },
      {
        name: "Export",
        link: "/settings",
      },
      {
        name: "Upload",
        link: "/settings",
      },
    ]
  }


]
const opt = [
  "Learn",
  "Create",
]

export const SitePicker = () => {
  return <div>
    <div class='text-xl p-1'>CS Lewis Notes</div>
    <div class='text-sm ml-2 mb-4'><Ab href='#'>by Datagrove</Ab></div>
  </div>

}
// we need to build based on the route
// everything can scroll off; maximum use of space. easy to find top anyway.
// we probably need a sticky to close? maybe this can be done with the rail though
export const SiteMenuContent: Component<{}> = (props) => {
  const st = usePage()
  const [sitemap] = createResource(st.doc.site, getSitemap)
  const [edit, setEdit] = createSignal(false)

  return <Suspense fallback={<div>Loading</div>}> <Show when={sitemap()}>
    <div class='transform h-full flex-1 '>
      <div class='pb-16 pt-2 px-2'>
        <div class='flex items-center'>
          <div class='flex-1 '><SegmentSwitch segments={opt} signal={[edit, setEdit]} /></div>
        </div>
        <Show when={edit()} fallback={
          <div class='mt-4'>
            <SitePicker />
            <SectionNav tabs={sitemap()!.menu} />
          </div>
        }>
          <div class='mt-4'>
            <SitePicker />
            <SectionNav tabs={editSection} />
          </div>
        </Show>
      </div></div></Show></Suspense>
}

// {/* <SitePreference page={pd()!} />
// <SiteSearchButton /> */}
export function SectionNav(props: { tabs: MenuEntry[] }) {
  // this needs be recursive, starting from the 
  // page is null?
  // const tabs = (): MenuEntry[] => {
  //   return (props.page.site.root.children![props.page.topSection].children) ?? []
  // }
  return (
    <ul class="flex flex-col gap-4">
      <For each={props.tabs}>
        {(page, i) => (
          <>
            <li>
              <h2 class="pl-2 text-solid-dark dark:text-white font-bold text-xl">
                {page.name}
              </h2>
              <SectionsNavIterate pages={page.children ?? []} />
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
  //page: PageDescription // is this the top page?
}) {
  const location = useLocation();

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
              href={subsection.path ?? ""}
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
                //page={props.page}
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


export const SegmentSwitch = (props: { signal: Signal<boolean>, segments: string[] }) => {

  // this should always give us a lang?
  const i = () => props.signal[0]() ? 1 : 0
  // maybe we should limit this to four some how? maybe we should adaptively change the representation (chips?) if we have too many.
  return (<div class="w-full mt-2 flex border border-solid-lightborder dark:border-solid-darkitem rounded-md"
  >    <For each={props.segments}>{(e, index) => (
    <a
      classList={{
        "bg-solid-light dark:bg-solid-dark font-semibold": index() == i(),
      }}
      class="flex-1 inline-flex w-full p-2 items-center justify-center whitespace-nowrap first:rounded-l-md border-r border-solid-lightborder dark:border-solid-darkitem hover:text-blue-500 hover:underline last:(rounded-r-md border-0)"
      onClick={() => props.signal[1](index() == 1)}
    >
      {e}
    </a>)
  }</For></div>)
}




// export class BrowseState {
//   // for each tab we need a most recent url visited
//   recent: string[] = []
// }


// what are the transitions?
// none -> adaptive | overlay depending on sitemap and 


// export type PageParams = Partial<{
//   ln: string
//   org: string
//   db: string
//   table: string
//   path: string
//   tag: string
// }>

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

// orgsite is a test value
// export const [site, setSite2] = createSignal<SiteStore>(prepSite(orgsite));
// export function setSite(s: MenuDefinition) {
//   setSite2(prepSite(s))
// }
// export function prepSite(sx: MenuDefinition): SiteStore {
//   const s: SiteStore = {
//     ...sx
//     , path: new Map()
//   }
//   console.log("set site", s)

//   const firstLeaf = (p: MenuEntry): MenuEntry => {
//     if (p?.children) {
//       return firstLeaf(p.children[0])
//     }
//     return p
//   }
//   // compile all the paths (not counting language) to a section or leaf.
//   // note that we 
//   const indexPaths = (o: MenuEntry, tab: number) => {
//     if (o.path) {
//       let lc = `/${tab}` + o.path
//       // s.search.push({
//       //   title: o.name.toLocaleLowerCase(),
//       //   href: lc
//       // })
//       s.path.set(lc, o)
//     }
//     for (let ch of o.children ?? []) {
//       // is this a problem? it's not clear how we would do it otherwise
//       // note that flutter for deep links often builds a stack of widgets, but web doesn't. we are only using this to get a reasonable configuration of the menu expansions
//       ch.parent = ch.parent ?? o
//       indexPaths(ch, tab)
//     }
//   }
//   s.root = { name: '/', children: s.sitemap }
//   s.home = s.home ?? firstLeaf(s.root);
//   for (let i = 0; i < s.root.children!.length; i++)
//     indexPaths(s.root.children![i], i)
//   return s
// }
