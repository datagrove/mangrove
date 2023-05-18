import { Component, For, Match, Show, Switch, createSignal } from "solid-js"
import { Kbd } from "../core/buttons"
import { Icon } from "solid-heroicons"
import { magnifyingGlass, xCircle, star, arrowLeft, arrowUp, arrowDown } from "solid-heroicons/solid"
import { SiteStore, MenuDefinition } from "./store"

const [search, setSearch] = createSignal([] as SearchResult[]) // = []
const [result, setResult] = createSignal<SearchResult[]>([])



interface SearchResult {
  title: string
  href: string
  favorite?: boolean
}

const [favorites, setFavorites] = createSignal<SearchResult[]>([
  // { title: "fav1", href: "xx" }
])
const [recent, setRecent] = createSignal<SearchResult[]>([
  // { title: "recent1", href: "xx" }
])

// move from recent to favorite
function addFavorite(x: number) {
  setFavorites([removeRecent(x), ...favorites()])
}
// remove from favorite
function removeFavorite(x: number) {
  const y = favorites()
  y.splice(x, 1)
  setFavorites(y)
}
function removeRecent(x: number) {
  const y = recent()
  const o = y.splice(x, 1)[0]
  setRecent(y)
  return o
}
function addRecent(x: SearchResult) {
  setRecent([x, ...recent()])
}
function fetchResults(site: SiteStore, sp: string): SearchResult[] {
  if (sp.length == 0) {
    return []
  }
  sp = sp.toLowerCase()
  const a = search().filter((e) => e.title.indexOf(sp) != -1)
  return a
}

const SearchBox = () => {
  const fn = (e: InputEvent) => {
    const p = (e.currentTarget as HTMLInputElement).value
    console.log("search", p)
    //setResult(fetchResults(s!, p))
  }
  return (<div class='w-full p-2'><div class=' flex items-center p-2 w-full border-solid-lightitem dark:border-solid-darkitem border rounded-md dark:bg-solid-dark'
    onclick={() => {
      console.log("search")
    }}
  >
    <Icon class="mr-2  h-6 w-6 flex-none text-neutral-500" path={magnifyingGlass} />
    <input autofocus
      class=" flex-1 border-0 focus:ring-0 focus:outline-none dark:bg-solid-dark"
      placeholder="Search" type="search" onInput={fn} /></div></div>)
}



// when we click a search it goes to recent. In recent we can star it to go to favorites. In favorites we can X it to delete it.

const FavoriteLink: Component<{
  result: SearchResult
  index: number
}> = (props) => {
  const deleteme = () => { removeFavorite(props.index) }
  return <div class='w-full hover:bg-blue-500 rounded-r-lg p-2 flex'>
    <a class='flex-1' href={props.result.href}>{props.result.title}</a>
    <button title={props.result.title} type='button' onclick={deleteme} class='text-neutral-500 hover:text-black dark:hover:text-white'><Icon class='h-6 w-6' path={xCircle}></Icon></button>
  </div>
}

const RecentLink: Component<{
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

const SearchLink: Component<{
  result: SearchResult
}> = (props) => {
  const clickme = () => {
    addRecent(props.result)
    location.href = props.result.href
  }
  return (<div class='pr-2'>
    <div class='w-full hover:bg-blue-500 rounded-r-lg p-2 flex'>
      <a onclick={clickme} class='flex-1 mx-2'> {props.result.title}</a>
    </div>
  </div>)
}



export const SearchPanel = () => {

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

  </div>)
}

function keyAdvice() {
  return <div class='  text-sm text-neutral-500 flex items-center'>
    <Kbd><Icon path={arrowLeft} /></Kbd> to select
    <Kbd><Icon path={arrowUp} /></Kbd><Kbd><Icon path={arrowDown} /></Kbd> to navigate <Kbd>Esc</Kbd> to close</div>
}


