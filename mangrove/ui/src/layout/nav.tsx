import { useLocation } from "@solidjs/router";
import { Collapsible, NavItem } from "./section";
import { For, Show } from "solid-js";
import { Page, PageDescription, site } from "./store";

// recursively build the sidbar menu
export function SectionsNavIterate(props: {
  pages: Array<Page>
  page: PageDescription
}) {
  const location = useLocation();
  function isLeafPage(page: Page): boolean {
    return page.children == null
  }

  // pure accordian style collapses everything not a parent of the url
  // it might be friendlier to allow things to be left open
  const isCollapsed = (pages: Page) => {
    // return !pages.some((page) => {
    //   return isLeafPage(page) && location.pathname == page?.link;
    // });
    return false
  };

  return (
    <For each={props.pages}>
      {(subsection: Page) => (
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


export function SectionNav(props: { page: PageDescription }) {
  // this needs be recursive, starting from the 
  return (
    <ul class="flex flex-col gap-4">
      <For each={props.page?.topTab?.children ?? []}>
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
// when we click a top tab, it should adjust the page being viewed; each tab maintains a router state. For example you should be able to go to a reference section without losing your place in the tutorial.
// if there is no prior state, we need to default to first page
export const SiteTabs = (props: { page: PageDescription }) => {
  const sections = () => site.root.children
  // this should always give us a lang?

  // maybe we should limit this to four some how? maybe we should adaptively change the representation (chips?) if we have too many.
  return (<div class="w-full mt-2 flex border border-solid-lightborder dark:border-solid-darkitem rounded-md"
  >    <For each={sections()}>{(e, index) => (
    <a
      classList={{
        "bg-solid-light dark:bg-solid-dark font-semibold": index() == props.page.topSection,
      }}
      class="flex-1 inline-flex w-full p-2 items-center justify-center whitespace-nowrap first:rounded-l-md border-r border-solid-lightborder dark:border-solid-darkitem hover:text-blue-500 hover:underline last:(rounded-r-md border-0)"
      href={"/" + props.page.lang + "/" + index()}
    >
      {e.name}
    </a>)
  }</For></div>)
}

/*
            <Show when={i() !== page>
              <li>
                <hr class="w-full mb-2" />
              </li>
            </Show>
*/