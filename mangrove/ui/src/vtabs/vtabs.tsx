import { Component, For, JSX, Show, splitProps } from "solid-js"
import Sortable from 'sortablejs'
import { chartBar, chevronLeft, ellipsisHorizontal, mapPin, xMark } from "solid-heroicons/solid"
import { Icon } from "solid-heroicons"
import { menuOpen, setMenuOpen, setVtabPin, vtabPin, vtabs } from "./vtab_store";
import { mobile, ShowSitemap, showSitemap } from "../layout/store";
import { datagrove } from "./dglogo";
import { Icon2 } from "./icon";


// this needs a hover flyout and a pin.
// we need to allow collapsing.
// this could probably have its own store, it's pretty independent.

// mobile will not call this 
// pin implies open
// unpin + open
// unpin + !open

// https://tabler-icons.io/


// the rail is the .sticky folder in the root.
export const Vtabs = () => {
    // left chevron action
    const shrink = () => {
        setVtabPin(!vtabPin())
    }
    // click on datagrove logo opens menu? this might not be correct
    const sitemap = () => {
        setMenuOpen(!menuOpen())
    }
    return (<div class=" h-screen cursor-pointer bg-white dark:bg-neutral-900 overflow-hidden" classList={{
        "w-16  hover:w-64 group": !vtabPin(),
        "w-full": vtabPin()
    }}>
        <div class='absolute  server-link z-20 items-center  dark:bg-neutral-900  flex top-0 w-full '>
            <Icon2 path={datagrove} class='w-12 h-12 flex-none text-blue-700 hover:text-blue-500 m-2' onclick={sitemap} />
            <div class='flex-1'> </div>
            <Show when={vtabPin()} >
                <Icon class='flex-none w-5 h-5 mr-2' path={chevronLeft}
                    onclick={shrink} /></Show>
            <Show when={!vtabPin()} >
                <Icon class='text-blue-500 hover:text-blue-700 opacity-0 group-hover:opacity-100 flex-none w-5 h-5 mr-4' path={mapPin}
                    onclick={shrink} /></Show>
        </div>
        <nav
            class='pt-16  h-full w-full li-none flex-row overflow-y-auto'
            ref={el => new Sortable(el, {
                animation: 150,
                ghostClass: 'bg-neutral-500'
            })} >


            <For each={vtabs.root!.children}>{(e, index) =>
                <div class='w-full server-link overflow-hidden  flex items-center'
                    classList={{
                        "server-link-active": index() == 3
                    }}>
                    <img title='a' class="flex-none rounded-md h-12 w-12 shadow m-2" src={e.icon} />
                    <Show when={showSitemap() != ShowSitemap.full}>
                        < div class=' flex-1 overflow-hidden cursor-pointer' > {e.label}</div >
                        <Icon class='flex-none  h-5 w-5 m-2 text-blue-700 hover:text-blue-500' path={ellipsisHorizontal} />
                    </Show>
                </div >
            }</For ></nav ></div >)

}

/*
import { For } from "solid-js"

import Sortable from 'sortablejs'

let rail = railItems()
// the rail is the .sticky folder in the root.
export const Rail = () => {
   return  (<nav ref={el=>new Sortable(el,{
        animation: 150,
        ghostClass: 'bg-slate-500'
    })} class='bg-gray-900   w-16 flex-none li-none flex-row'>
   
        <For each={rail}>{(e) =><div class=''><img class=" rounded-full h-12 w-12 shadow m-2" src={e.icon} /></div>
            
        }</For></nav>)

}*/