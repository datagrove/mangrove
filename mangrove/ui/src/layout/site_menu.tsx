import { useLocation } from "@solidjs/router"
import { Icon } from "solid-heroicons"
import { magnifyingGlass, xCircle, arrowDown, arrowUp, arrowLeft, star } from "solid-heroicons/outline"
import { Component, createSignal, For, JSX, Match, Show, Switch } from "solid-js"
import { CloseButton, Kbd } from "../core/buttons"
import { SectionNav, SiteTabs } from "./nav"
import { SitePreference } from "./preference"

import { Page, site, PageDescription, searchMode, setSearchMode, SearchResult, recent, favorites, addRecent, addFavorite, removeRecent, removeFavorite, fetchResults } from "./store"



// we need to build based on the route
// everything can scroll off; maximum use of space. easy to find top anyway.
// we probably need a sticky to close? maybe this can be done with the rail though
export const SiteMenuContent: Component<{ page: PageDescription }> = (props) => {
  return <div class='pb-16 pt-2 px-2'>
    {site.title}
    <div class='flex items-center'>
      <div class='flex-1 '><SiteTabs page={props.page} /></div>
    </div>
    <SitePreference page={props.page} />
    <SiteSearchButton />
    <div class='mt-4'>
      <SectionNav page={props.page} />
    </div>
  </div>
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
  const fn = (e: InputEvent) => {
    const p = (e.currentTarget as HTMLInputElement).value
    console.log("search", p)
    setResult(fetchResults(p))
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

