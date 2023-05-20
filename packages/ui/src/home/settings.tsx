import { Match, Switch } from "solid-js"
import { usePage } from "../core"
import { SectionNav } from "./site_menu"
import { Form, createForm, createCells, fcandy, fcell } from "../form"
import { db } from "../db"


// should paths be relative here?
const show = [
    {
        "name": "Settings",
        "path": "/en/jim.hurd",
        "children": [
             {
                   "name": "Appearance",
                   "path": "appearance",
             },
             {  
                "name": "Security",
                "path": "security",
             }           
        ]
    }
]

export function Settings() {
    return <div class='w-full pb-16 pt-2 px-2'>
        <SectionNav tabs={show} />
    </div>
}

export function SettingsViewer() {
    const page = usePage()
    const path = page.doc.path
    // for internal forms like this we can use the path as arbitrary key
    // some people will want the ability to use when impersonating a database
    // we need to build a form that points to the users stored settings.
    // potentially do nothing though? Form itself may have placeholder for "current user"
    return <Switch>
        <Match when={path === "appearance"}>
            <div>Appearance</div>
            </Match>
        <Match when={path === "security"}>
            <SecuritySettings/>
            </Match>
    </Switch>
}

// static generated

// are settings always loaded in general so we can use them to present the ui?
// does that mean we already have lens when we log in?
function SecuritySettings() {
    const r = createCells("settings", {
        fname: {}
    })
    const f =  createForm( [
        fcell(r.fname, { 
            name: "", 
            type: "text" }),
        fcandy("submit")
    ])
    
    return <div>
        <Form form={f} />
    </div>
}

