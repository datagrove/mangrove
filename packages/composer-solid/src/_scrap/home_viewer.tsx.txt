import { JSXElement, Show, Suspense, createResource, createSignal } from "solid-js"
import { getDocument, usePage } from "../core"
import { SegmentSwitch } from "../form"
import { H2 } from "../layout/nav"
import { BlueButton, Segment } from "../lib/form"
import { SearchBox } from "./search"
import { SectionNav } from "./site_menu"

//  <H2>{sp.user.name}</H2>

// most urls will have a "next" and a "previous" that we can access from a signal
// possibly move into page context

async function getNext() {
    return ""
}
async function getPrevious() {
    return ""
}

//  <SearchBox placeholder={seg[0]() ? 'Search templates' : 'Search recent'} />

// show a list of templates, we can slide forward and back from here or in the viewer.
export function Home() {
    const sp = usePage()
    const seg = createSignal(false)
    // recent
    // you might be interested
    // New 
    return <div class='mx-2 space-y-4'>
        <SegmentSwitch segments={["Find", "Create"]} signal={seg} />
       
        <Show when={seg[0]()}>

            <section>

                <TemplateList />
            </section></Show>
    </div>
}
// should paths be relative here?
const show = [
    {
        "name": "",
        "path": "/en/jim.hurd",
        "children": [
            {
                "name": "Online sales",
                "path": "online",
            },
            {
                "name": "In-home service",
                "path": "service",
            }
        ]
    }
]

// clicking on a template shows the template in viewer screen with a button to generate the template
export function TemplateList() {
    return <div>
        <SectionNav tabs={show} />
    </div>
}

export function FbButton(props: { children: JSXElement, onClick: () => void }) {
    return <div class='w-24'><BlueButton onClick={props.onClick}>{props.children}</BlueButton></div>
}
// mostly a grid viewer in recent order?
export function HomeViewer() {
    const sp = usePage()
    const pg = createResource(sp.doc, getDocument)

    const copy = () => { }
    const prev = async () => {

    }
    const next = () => { }
    return <div class='w-full'>
        <div class='flex justify-between h-12 items-center dark:bg-neutral-900'>
            <div ><FbButton onClick={prev}>Previous</FbButton></div>
            <div><FbButton onClick={copy} >Create</FbButton></div>
            <div ><FbButton onClick={next}>Next</FbButton></div>
        </div>
        <div class='w-full m-2'>
            <Suspense fallback={<div>Loading</div>}>

            </Suspense>
        </div>
    </div>
}