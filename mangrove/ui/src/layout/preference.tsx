import { Icon } from "solid-heroicons"
import { chevronRight, sun, moon, cog_6Tooth as gear, language} from "solid-heroicons/solid"
import { createSignal, ParentComponent, Show } from "solid-js";
import { Select } from "../core/select";
import { dgos, PageDescription, site } from "../layout/store";

const [isDark, setIsDark] = createSignal(true)

export const DarkButton = ()=> {
    return (<button
    type="button"
    aria-label={`Use ${isDark() ? "light" : "dark"} mode`}
    onClick={() => {
        const html = document.querySelector("html")!
        setIsDark(!isDark())
        isDark()
        ? html.classList.add("dark")
        : html.classList.remove("dark");
        dgos('dark',isDark())
     } }>

    <Show
    when={isDark()}
    fallback={<Icon path={moon} class="w-6 h-6"></Icon>}
    >
    <Icon path={sun} class="w-6 h-6"></Icon>
    </Show>
    </button>)
}

// language selector

const LanguageSelect: ParentComponent<{page:PageDescription}> = (props) =>{
  // change the language has to change the route. It doesn't change the store
  const update = (e: string) => {
  }
  return (<Select entries={site.language} value={props.page.lang} onchange={update}>
    {props.children}</Select>)
}
export const SitePreference = (props: {page:PageDescription}) => {
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
            class={`w-6 h-6 text-solid-lightaction dark:text-solid-darkaction transform transition ${
              !collapsed() ? "rotate-90" : ""
            }`}
          />
        </button>
        <Show when={!collapsed()}>
          <div aria-label="preferences" class="p-4 border-t border-solid-lightitem dark:border-solid-darkitem">
            
            <div class='flex items-center'><div class='flex-1'><LanguageSelect page={props.page}>
              <Icon class='h-5 w-5' path={language} />
              </LanguageSelect></div><div class='flex-none'><DarkButton/></div></div>
            <div class='flex'><div class='flex-1'></div></div>
          </div>
        </Show>
      </div>
    );
}