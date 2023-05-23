import { A, useLocation, useNavigate } from "@solidjs/router"
import { Component, For, JSXElement, Match, Show, Suspense, Switch, createResource, createSignal } from "solid-js"
import { TextViewer, TextEditor } from "../lexical"
import { SettingsViewer } from "./settings"
import { ChatViewer, WhiteboardViewer, SheetViewer, CodeViewer } from "./viewer"
import { DocumentContext, MenuEntry, Viewer, getDocument, getSitemap, usePage } from "../core"
import { Icon } from "solid-heroicons"
import { chevronLeft, bars_3, magnifyingGlass, homeModern, plus, bookOpen, shoppingBag, videoCamera, pencilSquare, chatBubbleOvalLeft } from "solid-heroicons/solid"
import { Bb, Ab } from "../layout/nav"
import { SearchBox } from "./search"
import { SectionNav } from "./site_menu"
import { TextDivider } from "../lib/form"
import { faker } from "@faker-js/faker"

// viewers are selected by the document type, can be overridden by the hash
export type ViewerMap = {
    [key: string]: Viewer
}
const builtinViewers: ViewerMap = {
    // "folder": { default: () => <FolderViewer /> },
    "text": { default: () => <TextViewer /> },
    "text-edit": { default: () => <TextEditor /> },
    "chat": { default: () => <ChatViewer /> },
    "settings": { default: () => <SettingsViewer /> },
    "whiteboard": { default: () => <WhiteboardViewer /> },
    "sheet": { default: () => <SheetViewer /> },
    "code": { default: () => <CodeViewer /> },
    "form": { default: () => <div>Form</div> } // can also be perspective of text?
}
export const [viewers, setViewers] = createSignal(builtinViewers)


// do we link to index.html?
// how do we edit this outline? 
// show segment with recent, or outline?
// how do we add a site?
// maybe the categories are the "pins/sticky", and they are edited in one page.

function Github() {
    return <><a href="https://github.com/datagrove/mangrove" class="github-corner" aria-label="View source on GitHub"><svg width="80" height="80" viewBox="0 0 250 250" style="fill:#151513; color:#fff; position: absolute; top: 0; border: 0; right: 0;" aria-hidden="true"><path d="M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z"></path><path d="M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2" fill="currentColor" style="transform-origin: 130px 106px;" class="octo-arm"></path><path d="M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z" fill="currentColor" class="octo-body"></path></svg></a></>
}

function getSites(): MenuEntry[] {
    return [
        {
            name: "Pinned", path: "/settings",
            children: [
                { name: "Public Blog", path: "/en/site/blog/" },
                { name: "Private Blog", path: "/en/site/private-blog/" },
                { name: "Private Notes", path: "/en/site/notes/" },
                { name: "Public Store", path: "/en/site/store/" },
                { name: "Private Store", path: "/en/site/private-store/" },
                { name: "Public Chat", path: "/en/site/chat/" },
                { name: "Private Chat", path: "/en/site/private-chat/" },
            ]
        },
        {
            name: "Recent", path: "/settings",
            children: [
                {
                    name: "Datagrove",
                    path: "/en/site/datagrove/welcome.html",
                },
            ]
        },
        {
            name: "My Sites", path: "/settings",
            children: [
                {
                    name: "Datagrove",
                    path: "/settings",
                },
            ]
        },
        {
            name: "Other", path: "/settings",
            children: [
                {
                    name: "Solid",
                    path: "/settings",
                }
            ]
        }
    ]
}

// the viewer can show a home page with pinned and most recent pages when its in the site context.
// <SegmentSwitch segments={opt} signal={[edit, setEdit]} />
// when ever we pick menu, we should always land on a page
// this means that at least one page can't be deleted.
// we need to build based on the route
// everything can scroll off; maximum use of space. easy to find top anyway.
// we probably need a sticky to close? maybe this can be done with the rail though
export const SiteMenuContent: Component<{}> = (props) => {
    const nav = useNavigate()
    const loc = useLocation()
    const st = usePage()
    const [sitemap] = createResource(st.doc.site, getSitemap)

    // level is just based on the path length.
    // the first piece of the path
    const showPages = () => loc.pathname.split("/").length > 3
    // in a path, the first bit is the site, the rest defines the page
    // to get the blocks in a page (outline) we need to get the page.
    // probably don't need to do in the tool, rather in the viewer.
    // when we select a site, 
    const siteView = () => <div>
        <SearchBox class='p-2' placeholder='Search Sites' />
        <SectionNav tabs={getSites()} />
    </div>

    const navback = () => {
        // /en/site/xxx ; this should position to the site xxx
        const p = loc.pathname.split("/").slice(0, 3).join("/")
        nav(p)
    }

    const pageView = () =>
        <Suspense fallback={<div>Loading</div>}>
            <Show when={sitemap()}>
                <div class='transform h-full flex-1 '>
                    <div class='pb-16  px-2'>
                        <div class='flex items-center'>
                            <div class='flex-1 '></div>
                        </div>

                        <div >
                            <SearchBox class='p-2' placeholder='Search pages' />
                            <Bb onclick={navback}><div class='flex text-xl p-1 items-center'>
                                <div>
                                    <Icon class='block w-5 h-5 mr-1' path={chevronLeft} /></div>
                                Anonymous</div></Bb>
                            <div class='text-sm ml-7 mb-4'><Ab href='#'>by Anonymous</Ab></div>
                            <SectionNav tabs={sitemap()!.menu} />
                        </div>


                    </div></div></Show></Suspense>

    return <Switch>wtf
        <Match when={!showPages()}>{siteView()}</Match>
        <Match when={showPages()}>{pageView()}</Match>
    </Switch>
}

// start at site, drill into pages, drill into blocks
// if we are at the site menu then we show a home page of sorts.
// pinned, recent, etc.
export function SiteViewer() {
    const loc = useLocation()
    const nav = useNavigate()

    const sp = usePage()
    const page = useLocation()
    const path = loc.pathname.split("/")
    const showPages = () => loc.pathname.split("/").length > 4

    const hash = page.hash.split("#")[0]

    const viewer = (doctype?: string): () => JSXElement => {
        const openWith = sp.viewer;
        doctype ??= ""
        let vn = openWith ? doctype + "-" + openWith : doctype
        const vt = viewers()[vn]
        if (!vt) return () => <div>no viewer {vn}</div>
        return vt.default
    }
    const [doc] = createResource(sp.doc, getDocument)

    return <Show when={showPages()} fallback={<Home />} >
        < Suspense fallback={< div > Loading document</div >}>
            <Show when={doc()}><DocumentContext.Provider value={doc()}>
                {viewer(doc()!.type)()}
            </DocumentContext.Provider></Show>
        </Suspense >
    </Show>
}

// these pages need a floating search/menu when small.
// maybe use a standard page tool.
// <div class='flex items-end  mx-8 flex-wrap space-y-6 space-x-6 '>
function Grid(props: { children: JSXElement[] }) {
    return <div style={{
        "display": "grid",
        "grid-template-columns": "repeat(auto-fit, minmax(130px, 1fr))"
    }}> {props.children}</div >
}


export type IconPath = typeof homeModern
// floating is for small screens only? map mode can still have the rail.
// when we scroll up the search should fix to the top.
//     <Icon class="hidden mr-2  h-6 w-6 flex-none text-neutral-500" path={magnifyingGlass} />
export function Home() {
    const nav = useNavigate()
    const Search = () => {
        const onMenu = () => { }
        return (<div class="dark:bg-neutral-900 shadow sm:rounded-lg  z-50 m-4 w-[372px]">
            <div class='flex items-center' >
                <button class='h-6 w-6 m-2' onClick={onMenu}>
                    <Icon path={bars_3} class='dark:text-white h-6 w-6' /></button>
                <div class='w-full'>
                    <div class=' flex items-center p-2 w-full    rounded-md'
                        onclick={() => {
                            console.log("search")
                        }}
                    >

                        <input autofocus
                            class=" flex-1 border-0 focus:ring-0 focus:outline-none dark:bg-solid-dark"
                            placeholder={"Search or type URL"} type="search" /></div></div>
            </div>
        </div>)
    }
    // related to SimplePage? but with search maybe?
    const Page = function (props: { children: JSXElement }) {

        return <div class='absolute left-0 right-0 top-0 bottom-0 overflow-y-auto'> {props.children}</div>
    }
    const o = getSites()
    const pinned = o[0].children

    const Card = (props: { href: string, name: string, icon: IconPath }) => {
        return <A href={props.href}><div class='p-2 m-2 w-28 h-28 flex flex-col justify-center text-center bg-neutral-900 hover:dark:bg-neutral-500 rounded-md' ><div class='flex justify-center w-full'><Icon path={props.icon} class='h-12 w-12' /></div>
            <div> {props.name}</div>
        </div></A>
    }
    const click = (m: MenuEntry) => {
        console.log("click", m)
    }

    const EventCard = (props: { children: JSXElement }) => {
        return <div class='w-full flex items-center  p-2 bg-neutral-900 hover:dark:bg-neutral-500 rounded-md' >
            <div class='flex '><Icon path={homeModern} class='h-12 w-12' /></div>
            <div class='flex-grow ml-2'> {props.children}
            </div></div>
    }

    return <Page>
        <Github />
        <h1 class='w-full text-center mt-16'>Datagrove</h1>
        <div class='flex justify-center'><Search /></div>

        <div class='w-full text-center text-neutral-500'>Find Help</div>
        <Grid>
            <Card name='Docs' icon={bookOpen} href='https://datagrove.com' />
            <Card name='Store' icon={shoppingBag} href='https://datagrove.com' />
            <Card name='Youtube' icon={videoCamera} href='https://www.youtube.com/@datagrove6599/featured' />
            <Card name='Our Blog' icon={pencilSquare} href='https://datagrove.com' />
            <Card name='Chat' icon={chatBubbleOvalLeft} href='https://datagrove.com' />
        </Grid>

        <div class='w-full p-4 text-center text-neutral-500'>Create</div>
        <div class='px-4'> <Grid>
            <Card name='New Site' icon={plus} href='#' />
            <For each={pinned}>{(e, i) => {
                return <Card name={e.name} icon={homeModern} href={e.name} />
            }}</For>
        </Grid></div>

        <div class='w-full p-4 text-center text-neutral-500'>Recent Activity</div>
        <div class='space-y-2'>
            <For each={pinned}>{(e, i) => {
                return <div class='flex items-end  mx-8 flex-wrap space-y-6 space-x-6 '>
                    <EventCard>
                        {faker.lorem.sentences(4)}
                    </EventCard>
                </div>
            }}</For></div>
    </Page>
}
