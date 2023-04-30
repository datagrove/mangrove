import './index.css'
import { JSXElement, Component, createSignal, For, Show, Switch, Match, createEffect } from 'solid-js'
import { render } from 'solid-js/web'
import { Route, Routes, Router, useNavigate, useParams, Outlet } from "@solidjs/router"


import { Page, Title, Body, H2 } from '@datagrove/ui'

interface PageParms {
    ln: string
}
// displays the users root profile: orgs, dbs, files, etc
function Home() {
    return <Page>
        <Title>Home</Title>
        <Body>
            <H2>Web Sites</H2>

        </Body>
    </Page>
}
/*
            <H2>Activity</H2>

            <H2>Organizations</H2>
            <H2>Identities</H2>
            <H2>Devices</H2>
            */

function RouteGuard() {
    const params = useParams<PageParams>()

    const navigate = useNavigate();

    createEffect(() => {
        // maybe token should be a session token or just a variable even.
        // should each tab need its own id? eventually we should use a sharedworker to log in. this sharedworker will keep a variable.
        if (!login()) {
            console.log('redirecting to login')
            navigate(`${params.ln ?? "en"}/login`, { replace: true });
        }
        else {
            navigate(`/${params.ln ?? "en"}`, { replace: true });
        }
    })
    // when={login()} 
    return (
        <Show when={true} fallback={<div>Loading...{login()}</div>}>
            <div>
                <Outlet />
            </div>
        </Show>
    )
}

function App2() {
    //const [items] =  createResource(props.fetch)

    return <>
        <Routes>
            <Route path="/test" element={<TestPage />} />
            <Route path="/:ln/login" component={LoginPasskey} />
            <Route path="/:ln/register" component={RegisterPasskey} />
            <Route path="/" component={RouteGuard}>
                <Route path="/:ln/" component={Home} />
                <Route path="/:ln/:org/~settings" component={Settings} />
                <Route path="/:ln/:org/~access" component={OrgAccess} />
                <Route path="/:ln/:org" component={OrgPage} />

                <Route path="/:ln/:org/:db/access" component={DbAccess} />
                <Route path="/:ln/:org/:db" component={DbPage} />

                <Route path="/:ln/:org/:db/t/:table" component={TablePage} />
                <Route path="/:ln/:org/:db/f/*path" component={FilePage} />
                <Route path="/:ln/:org/:db/log/:id" component={JobPage} />

                <Route path="/:ln/:org/:db/th/:tag/:table" component={TablePage} />
                <Route path="/:ln/:org/:db/fh/:tag/*path" component={FilePage} />
                <Route path="/*path" component={NotFoundPage} />
            </Route>
        </Routes></>
}

render(
    () => (
        <Router >
            <App2 />
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
