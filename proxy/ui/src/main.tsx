import './index.css'
import { JSXElement, Component, createSignal, For, Show, Switch, Match, createEffect } from 'solid-js'
import { render } from 'solid-js/web'
import { Route, Routes, Router, useNavigate, useParams, Outlet } from "@solidjs/router"


import { Page, Title, Body } from '@datagrove/ui'

interface PageParms {
    ln: string
}
// displays the users root profile: orgs, dbs, files, etc
function Login() {
    const p = useParams<{ln:string}>()

    return   <div>hello, world {p.ln} </div>
}


function App() {
    //const [items] =  createResource(props.fetch)
  
    return <Routes>
            <Route path="/:ln/login" component={Login} />
            </Routes>
}       

render(
    () => (
        <Router >
            <App />
        </Router>
    ),
    document.getElementById("app")!
)


/*
function Home() {
    const navigate = useNavigate();
    const a = security()
    navigate(`/en/${a.defaultUser}`)
    return <div>Loading...</div>
}
function Home2() {
    const navigate = useNavigate();
    const a = security()
    // redirect to current user's home page
    // this needs to be async to make a decision?

    if (!login())
        navigate('/~/login')
    else if (a.defaultUser) {
        navigate(`/en/${a.defaultUser}`)
    }
    return <>
        <Center>
            <BlueButton onClick={createUser}>New User</BlueButton>
            <ToggleSection class='mt-2' header="Link user">
                <P class='text-center'>Scan from a linked device</P>
                <img class='w-96 mt-2' src="qr.png" />
            </ToggleSection>
        </Center>
    </>
}
*/
