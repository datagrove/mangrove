import { SectionNav } from "./site_menu"



const show = [
    {
        "name": "Messages",
        "path": "/en/jim.hurd",
        "children": [

            {
                "name": "Personal",
                "path": "/en/jim.hurd",
                "children": [
                    {
                        "name": "Theme",
                        "path": "/en/jim.hurd"
                    }
                ]
            },

            {
                "name": "Group",
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

export function Message() {
    return <div class='w-full pb-16 pt-2 px-2'>
        <SectionNav tabs={show} />
    </div>
}