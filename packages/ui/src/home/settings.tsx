import { SectionNav } from "./site_menu"


const show = [
    {
        "name": "Settings",
        "path": "/en/jim.hurd",
        "children": [

            {
                "name": "Appearance",
                "path": "/en/jim.hurd",
                "children": [
                    {
                        "name": "Theme",
                        "path": "/en/jim.hurd"
                    }
                ]
            },

            {
                "name": "Security",
                "path": "/en/jim.hurd",
                "children": [
                    {
                        "name": "Login",
                        "path": "/en/jim.hurd"
                    },
                    {
                        "name": "Recover",
                        "path": "/en/jim.hurd"
                    },
                    {
                        "name": "Register",
                        "path": "/en/jim.hurd"
                    }
                ]
            }
        ]
    }
]

export function Settings() {
    return <div class='w-full pb-16 pt-2 px-2'>
        <SectionNav tabs={show} />
    </div>
}