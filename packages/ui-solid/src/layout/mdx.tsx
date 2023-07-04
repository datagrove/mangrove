
import { createEffect, createSignal, Show } from "solid-js"
import { chevronLeft, chevronRight } from "solid-heroicons/solid"
import { Icon } from "solid-heroicons"
import { buildToc, md2html } from "../md"
import { showToc } from "../home/site_menu"

// the content can be a custom app url, or could be some standard app that this program already knows how to read. each concierge site has a menu that picks.
// the content of Layout must all live in an iframe, unless it is the internal content (settings).
// what about a specialized splitter that allows one side to hide?
// sort building that here though.
// not really just the toc, this renders the markdown with a toc
// builds the toc from the html generated.
export function Mdx(props: {md: string}) {
    const [aside, setAside] = createSignal(null as HTMLElement | null)
    const [content, setContent] = createSignal(null as HTMLElement | null)

    // this has to use the location to display the text and the prev/next buttons
    // we might want this to be handled differently when viewing a snapshot.
    // if its a snapshot is also part of the route
    // this code could live in a service worker or even a ssr 
    // the data for the page will live in a database.
   createEffect(() => {
        md2html(props.md).then((e) => {
            content()!.innerHTML = e
            buildToc(content()!, aside()!)
        })
    })
    const isPrev = ()=>"Fubar 1"
    const isNext = ()=>"Snafu 2"

    // toc main sets up the grid
    return (<main class="w-full ">
        <article>
            <div class='w-full pl-4 pt-4 pb-16 prose dark:prose-invert prose-neutral' >
                <div class='' ref={setContent} />
                <div class='flex pt-4'>
                <Show when={isPrev()}>
                    <button class='mr-4 flex-1 flex p-2 items-center rounded-md border border-solid-darkitem hover:border-solid-lightitem'>
                   <Icon class='h-8 w-8' path={chevronLeft} />
                    <div class='flex-1 '>
                        <div class='uppercase text-neutral-500'>PREVIOUS</div>
                        <div>{isPrev()}</div>
                    </div>
                    </button>
                </Show>
          
                <Show when={isNext()}>
                <button class='flex-1 ml-4 flex p-2 items-center rounded-md border border-solid-darkitem  hover:border-solid-lightitem'>
                    <div class='flex-1'>
                        <div class='uppercase text-neutral-500'>NEXT</div>
                        <div>{isNext()}</div>
                    </div>
                    <Icon class='h-8 w-8 flex-none' path={chevronRight} />
                    </button>
                </Show></div>
            </div>
        </article>

        <aside class="absolute right-0 z-10 not-prose dark:bg-gradient-to-r dark:from-neutral-900 dark:to-neutral-800 p-4 rounded-md from- text-sm bottom-16 ml-8 mt-12 mr-8 dark:text-neutral-400"
            classList={{
                "hidden": !showToc()
            }}
        >
            <div class='text-white mb-2 pl-2 flex'>
                <div class='flex-1'>On this page</div>
            </div>
            <div id="aside" class=" " ref={setAside} />
        </aside>
    </main>)
}