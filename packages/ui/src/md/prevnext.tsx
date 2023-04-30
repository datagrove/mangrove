import { NavLink } from "@solidjs/router";
import { JSXElement, Show, For, createSignal } from "solid-js";
import { useLocation } from "@solidjs/router";
import { createEffect, useContext } from "solid-js";
import { createContext, ParentProps } from "solid-js";
import { createStore } from "solid-js/store";
import { Icon } from "solid-heroicons";
import { chevronRight } from "solid-heroicons/solid";

// could be used for a bubble
export function Dot(props: { number: number }) {
  return (
    <div class="rounded-full pt-1 w-6 h-6 border border-solid-lightitem dark:border-solid-darkitem grid place-content-center bg-solid-light dark:bg-white text-solid-accent font-bold">
      {props.number}
    </div>
  );
}

// not clear why we would want provider here? why would different parts of the tree have different page states?
type Section = {
  title: string;
  href: string;
};

type PageStateData = {
  sections: () => readonly Section[];
  addSection: (title: string, href: string) => void;
};
// by using a page state provider, maybe its easier to make this data available to mdx plugins
export const PageStateContext = createContext<PageStateData>();
export const usePageState = () => useContext(PageStateContext);

export const PageStateProvider = (props: ParentProps) => {
  const [store, setStore] = createStore<{ sections: Section[]; path: string }>({
    sections: [],
    path: "",
  });

  const data: PageStateData = {
    sections() {
      return store.sections;
    },
    addSection(title, href) {
      setStore("sections", (sections) => [
        ...new Set([...sections, { title, href }]),
      ]);
    },
  };

  createEffect(() => {
    const { pathname } = useLocation();
    setStore("sections", []);
    setStore("path", pathname);
  });

  return (
    <PageStateContext.Provider value={data}>
      {props.children}
    </PageStateContext.Provider>
  );
};



interface IPrevNextSectionProps {
  title: string;
  href: string;
}

interface IPrevNextSectionBaseProps extends IPrevNextSectionProps {
  type: 'prev' | 'next',
}

const PrevNextSectionBase = (props: IPrevNextSectionBaseProps) => {
  return <NavLink
    class="flex items-center border dark:border-solid-darkitem hover:dark:border-solid-darkaction transition rounded-lg p-4 justify-between group flex-1"
    href={props.href}
  >
    <Show
      when={props.type === "prev"}
    >
      <Icon path={chevronRight} class="w-6 h-6 text-solid-lightaction dark:text-solid-darkaction transform transition group-hover:-translate-x-2 rotate-180" />
    </Show>

    <div class="flex flex-col">
      <span class="uppercase dark:text-neutral-500 text-xs font-semibold">{props.type === "prev" ? "Previous" : "Next"}</span>
      {props.title}
    </div>
    <Show
      when={props.type === "next"}
    >
      <Icon path={chevronRight} class="w-6 h-6 text-solid-lightaction dark:text-solid-darkaction transform transition group-hover:translate-x-2" />
    </Show>
  </NavLink>
}

export const NextSection = (props: IPrevNextSectionProps) => <PrevNextSectionBase type="next" title={props.title} href={props.href} />
export const PrevSection = (props: IPrevNextSectionProps) => <PrevNextSectionBase type="prev" title={props.title} href={props.href} />

export const PrevNextSection = (props: { children: JSXElement }) => (
  <div class="mt-10 flex flex-col md:flex-row gap-4">
    {props.children}
  </div>
);


/*

// fix the sections, implement next / previous. how? do we need a footer below the iframe? that won't work well in many cases. We can do it for sanitized markdown though. note that ssg doesn't work here; we need to generate the html locally or run it in an iframe, we can do both. what are the pros and cons of each?
export function Main(props) {
  const location = useLocation();
  const [pages, setPages] = createStore(() => {
    let prevPage: SECTION_LEAF_PAGE, nextPage: SECTION_LEAF_PAGE;

    if (location.pathname.startsWith("/references")) {
      [prevPage, nextPage] = getNextPrevPages(
        location.pathname,
        REFERENCE_SECTIONS
      );
    } else if (location.pathname.startsWith("/guides")) {
      [prevPage, nextPage] = getNextPrevPages(
        location.pathname,
        GUIDES_SECTIONS
      );
    } else {
      return null;
    }
    return { prevPage, nextPage };
  });

  // const nextStartSection = () => getStartSection(location.pathname);

  return (
    <main class="flex flex-col md:flex-row items-start justify-between flex-grow">
      <div class="pt-4 md:pt-10 w-full lg:max-w-xs sticky z-50 top-0 md:hidden">
        <Summary collapsed={true} />
      </div>
      <article class="min-w-0 w-full md:max-w-4xl lg:max-w-3xl mx-auto">
        <div class="flex justify-start">
          <div class="flex w-full flex-col min-h-screen md:px-5 sm:px-12">
            <div
              ref={props.ref}
              class="w-full flex-grow ml-0 flex justify-center"
            >
              <div class="w-full">{props.children}</div>
            </div>
            <div>
              // <Show when={!!nextStartSection()}>
              //   <NavLink
              //     class="hover:underline block mt-20 mb-10 text-center"
              //     href={nextStartSection().link}
              //   >
              //     Next up: {nextStartSection().title} &raquo;
              //   </NavLink>
              // </Show> 
              <Show when={pages() !== null}>
                <PrevNextSection>
                  <Show when={pages().prevPage?.link}>
                    <PrevSection
                      title={pages().prevPage.name}
                      href={pages().prevPage.link}
                    />
                  </Show>
                  <Show when={pages().nextPage?.link}>
                    <NextSection
                      title={pages().nextPage.name}
                      href={pages().nextPage.link}
                    />
                  </Show>
                </PrevNextSection>
              </Show>
              <Footer />
            </div>
          </div>
        </div>
      </article>
      <div class="pt-4 md:pt-10 w-full lg:max-w-xs sticky z-50 top-0 hidden md:block">
        <Summary />
      </div>
    </main>
  );
}

*/