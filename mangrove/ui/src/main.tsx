import './index.css'
import { JSXElement, Component, createSignal, For, onMount, Show, createResource, Switch, Match, createEffect } from 'solid-js'
import { render } from 'solid-js/web'
import { Route, Routes, Router, useNavigate, useParams, hashIntegration, Outlet } from "@solidjs/router"
import { BackNav, H2, Page, A } from './lib/nav'
import { OrError, Rpc } from './lib/socket'
import { Center, LoginPage, LoginPage2, PasswordPage, RecoveryPage, RegisterPage, token, BlueButton } from './lib/login'
import { createPresentation, createWs } from './lib/db'
import { Dbref, jobEntry, dbref, taskEntry, runnable } from './lib/schema'


function mdate(n: number): string {
    return new Date(n).toLocaleDateString('en-us', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' })
}

const Button = (props: { children: JSXElement, onClick: () => void }) => {
    return <button class='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'>{props.children}</button>
}

const JobPage: Component = () => {
    const params = useParams()
    // const getLog = async (s: string) => {
    //     return {} as JobEntry  // await cn.get<JobEntry>('log')
    // }
    // const [log2] = createResource(() => params['id'], getLog)

    const [log] = createPresentation(jobEntry, { db: params['db'] })
    const [task] = createPresentation(taskEntry, { db: params['db'] })
    const title = (): string => {
        if (log.loading) return "Loading"
        if (log.error) return log.error
        const v = log.latest!.value![0]
        return v.name + " " + mdate(v.start)
    }
    return <Page title={title()} back={`/db/${params['db']}`}>
        <H2>Tasks</H2>
        <table class='table-auto'>
            <thead><tr><th>Name</th><th>Start</th><th>Duration</th><th>Output</th></tr></thead>
            <For each={log.latest!.value}>{task => <tr>
                <td class='border px-8 py-4'>{task.name}</td>
                <td class='border px-8 py-4'>{mdate(task.start)}</td>
                <td class='border px-8 py-4'>{(task.end - task.end) / 1000}</td>
                <td class='border px-8 py-4'>todo</td></tr>
            }</For>
        </table></Page>
}
// we should show primary a list of logs, and maybe a drop down with jobs to run
// we should show a list of jobs that will be run on a timer
// we should show a list of jobs that have been run
const DatabasePage: Component = () => {
    const ws = createWs();
    const params = useParams()
    // const getDash = async (s: string) => {
    //     return await ws.rpc<Dash>('dash', { db: s })
    // }
    const [runnable2] = createPresentation(runnable, { db: params['db'] })
    const [jobs] = createPresentation(jobEntry, { db: params['db'] })

    const navigate = useNavigate()
    const run = (name: string) => { }
    const showLog = (id: string) => navigate(`/db/${params['db']}/log/${id}`)

    return <Page title={params['db']} back={'/'} >
        <Switch>
            <Match when={runnable2.loading}>
                Loading
            </Match>
            <Match when={runnable2.error}>
                {runnable2.error}
            </Match>
            <Match when={true} >
                <H2>Jobs</H2>
                <table class='table-auto'>
                    <thead><tr><th>Name</th><th>Next Run</th><th></th></tr></thead>
                    <For each={runnable2.latest!.value}>{(e, i) => {
                        return <tr class='hover:bg-neutral-500' >
                            <td class='border px-8 py-4'>{e.name}</td>
                            <td class='border px-8 py-4 w-64'>{e.next ? mdate(e.next) : ""}</td>
                            <td class='border px-8 py-4'><Button onClick={() => run(e.name)}>Run</Button></td>
                        </tr>
                    }}</For>
                </table>

                <H2>Recent</H2>
                <table class='table-auto'>
                    <thead><tr><th>Start</th><th>End</th><th>Name</th><th>Summary</th></tr></thead>
                    <For each={jobs.latest!.value}>{(e) => {
                        return <tr class='hover:bg-neutral-500' onClick={() => showLog(e.id)}>
                            <td class='border px-8 py-4'>{mdate(e.start)}</td>
                            <td class='border px-8 py-4'>{mdate(e.end)}</td>
                            <td class='border px-8 py-4'>{e.name}</td>
                            <td class='border px-8 py-4'>{e.summary}</td></tr>
                    }}</For>
                </table></Match></Switch>
    </Page>
}

const DatabaseList: Component = () => {
    const ws = createWs();
    const [lst] = createPresentation<Dbref>(dbref)
    return <Show when={!lst.loading}><Page title={"Database"}>

        <table class='table-auto'>
            <For each={lst.latest!.value}>{(e) => <tr><td>
                <A href={`/db/${e}`}>{e.name}</A></td></tr>}
            </For >
            <A href='/add'>Add</A> <A class='ml-2' href='/profile'>Profile</A>
        </table>
    </Page></Show>
}
const ComingSoon: Component = () => {
    return <Page title='Coming Soon'>
        <Center>
            <H2>Coming Soon</H2>
        </Center>
    </Page>
}
function RouteGuard() {
    const navigate = useNavigate();

    createEffect(() => {
        if (!token()) {
            console.log('redirecting to login')
            navigate('/login', { replace: true });
        }
    })

    return (
        <div>
            <Outlet />
        </div>
    )
}

function ProfilePage() {
    return <Page title='Profile'>
        <Center>
            <textarea class='w-full' placeholder='Add SSH key'></textarea>
            <BlueButton onClick={() => { }}>Add</BlueButton>
        </Center>
    </Page>
}
function App() {
    //const [items] =  createResource(props.fetch)
    return <>
        <Routes>

            <Route path="/login" component={LoginPage} />
            <Route path="/login2" component={LoginPage2} />
            <Route path="/recover" component={RecoveryPage} />
            <Route path="/register" component={RegisterPage} />
            <Route path="/" component={RouteGuard}>
                <Route path="/profile" component={ProfilePage} />
                <Route path="/add" component={ComingSoon} />
                <Route path="/" component={DatabaseList} />
                <Route path="/db/:db" component={DatabasePage} />
                <Route path="/db/:db/log/:id" component={JobPage} />
            </Route>
        </Routes></>
}


// profile is the global state
// it never changes server, and is loaded from the home server.
// we can use iframes and open new tabs for other ones.
// it could be prerendered
// it can be provided a shared worker or service worker.



render(
    () => (
        <Router source={hashIntegration()}>
            <App></App>
        </Router>
    ),
    document.getElementById("app")!
)


