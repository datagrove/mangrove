import { Match, Switch } from "solid-js"
import { setLogin_, usePage } from "../core"
import { SectionNav } from "./site_menu"
import { Form, createForm, fcandy, fcell } from "../form"
import { db } from "../db"
import { createCells } from "../db/cell"
import { Bb, H2, H3 } from "../layout/nav"
import { useLocation, useNavigate } from "@solidjs/router"
import { LanguageSelect } from "../i18n/i18"
import { DarkButton } from "../lib"


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

// this needs to jump back to the user site from whatever site they are on.
// how do we make sure the site they are on can't fake this? the site they are on can't access the login cookie anyway.
// maybe everything but the rail is in an iframe.
// then the url at the top is in control of the rail.
export function Settings() {
    const nav = useNavigate()

    const signout = () => {
        setLogin_(null)
        localStorage.removeItem("login")
        nav("/")
    }
    return <div class='w-full pb-16 pt-2 px-2'>
        <div class='ml-2'>
            <H2>Anonymous</H2>
            <Bb class='mb-2' onClick={signout}>Sign Out (all tabs)</Bb>
        </div>
        <SectionNav tabs={show} />
    </div>
}

export function SettingsViewer() {
    const page = useLocation()
    const path = page.pathname.split("/").pop()
    // for internal forms like this we can use the path as arbitrary key
    // some people will want the ability to use when impersonating a database
    // we need to build a form that points to the users stored settings.
    // potentially do nothing though? Form itself may have placeholder for "current user"
    return <div>
        <Switch>
            <Match when={path === "appearance"}>
                <div class='ml-2'>
                    <H2>Appearance</H2>
                    <H3>Select languages in order of preference</H3>
                    <div class='flex space-x-6'>
                        <div class='w-96'><LanguageSelect /></div>
                        <div class='w-96'><LanguageSelect /></div>
                    </div>
                    <DarkButton />
                </div>
            </Match>
            <Match when={path === "security"}>
                <div class='ml-2'>
                    <H2>Security</H2>
                    <SecuritySettings />
                </div>
            </Match>
        </Switch>
    </div>
}

// static generated

// are settings always loaded in general so we can use them to present the ui?
// does that mean we already have lens when we log in?
function SecuritySettings() {
    const r = createCells({
        name: "settings",
        primary: ["name"],
        cells: {
            name: {
                name: "name",
                type: "text",
                default: "Anonymous",
                autofocus: true,
                autocomplete: "username",
            },
        }
    })
    const f = createForm([
        fcell(r.fname, {
            name: "",
            type: "text"
        }),
        fcandy("submit")
    ])

    return <div>
        <Form form={f} />
    </div>
}

