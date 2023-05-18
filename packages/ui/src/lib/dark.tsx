import { Icon } from "solid-heroicons";
import { moon, sun } from "solid-heroicons/solid";
import { Show, createSignal } from "solid-js";


const [isDark, setIsDark] = createSignal(true)
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
        fallback={<Icon path={moon} class="w-8 h-8"></Icon>}
      >
        <Icon path={sun} class="ml-1 w-8 h-8"></Icon>
      </Show>
    </button>)
  }