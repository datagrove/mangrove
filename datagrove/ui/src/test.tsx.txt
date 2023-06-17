import { render } from "solid-js/web"
import { InputCell } from "../../../packages/ui/src/lib/input"
import { ViewDesc, createCells } from "../../../packages/ui/src/db"
import { Router } from "@solidjs/router"

    function Test(){
        const view: ViewDesc = {
            name: "test",
            cells: {
                username: {
                    name: "username",
                    default: "wtf1",
                    type: "text",
                    autofocus: true,
                    autocomplete: "username",
                },
                password: {
                    name: "password",
                    default: "wtf2",
                    type: "password",
                    autocomplete: "current-password",
                },
                email: {
                    name: "email",
                    type: "email",
                    default: "wtf3",
                    autocomplete: "email",
                },  
            },
            primary: ["username"]
        }
        const c = createCells(view)

        return <div>wtf
            <InputCell cell={c.username} />
            <InputCell cell={c.password} />
            <InputCell cell={c.email} />
        </div>
    }
 render(() => (<Router><Test /></Router>), document.getElementById("app")!)
