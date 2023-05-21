import { Show, createSignal } from "solid-js"
import { usePage } from "../core"
import { SegmentSwitch } from "../form"
import { H2 } from "../layout/nav"
import { BlueButton, Segment } from "../lib/form"
import { SearchBox } from "./search"
import { SectionNav } from "./site_menu"

//  <H2>{sp.user.name}</H2>

// there's a lot to do here
export function Home() {
    const sp = usePage()
    const seg = createSignal(false)
    // recent
    // you might be interested
    // New 
    return <div class='mx-2 space-y-4'>
        <SegmentSwitch segments={["Recent", "Create"]} signal={seg} />
        <SearchBox placeholder={seg[0]() ? 'Search templates' : 'Search recent'} />
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

// mostly a grid viewer in recent order?
export function HomeViewer() {
    return <div class='m-2 w-full'>
           <div class='max-w-md flex items-start'>
           <div><BlueButton class='block' >Create new</BlueButton></div></div>
    </div>
}