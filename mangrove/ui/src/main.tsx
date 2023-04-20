import './index.css'
import { JSXElement, Component, createSignal, For, onMount, Show, createResource, Switch, Match, createEffect, Accessor } from 'solid-js'
import { render } from 'solid-js/web'
import { Route, Routes, Router, useNavigate, useParams, hashIntegration, Outlet } from "@solidjs/router"
import { BackNav, H2, Page, A, Body, Title } from './lib/nav'
import { OrError, Rpc, profile } from './lib/socket'
import { LoginPage, LoginPage2, PasswordPage, RecoveryPage, RegisterPage, token, } from './lib/login'
import { Datagrove, Presentation, Pt, createPresentation, rows } from './lib/db'
import { Dbref, dbref, taskEntry,  } from './lib/schema'
import { BlueButton, Center } from './lib/form'
import { Folder, createWatch, entries } from './lib/dbf'

function mdate(n: number): string {
    return new Date(n).toLocaleDateString('en-us', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' })
}

const Button = (props: { children: JSXElement, onClick: () => void }) => {
    return <button class='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'>{props.children}</button>
}

// isolate this in case we change the api
// queries need a return row and a arguments
// in some cases the arguments can be complex.
function createQuery<R,A={}>(t: Pt<R,A>,a?:A) {
    // the db in params needs to be org.db, maybe it should be server.org.db
    const params = useParams()
    // $ indicates a schema.table
    return createPresentation(t, params['schema'],a)
}

interface JobEntry extends File {
    path: string
    next: number
    recent: number
    recentLog: string
}
const createJobView = () => {
    return createQuery<JobEntry>({table: 'job'})
}
const createDatabaseView = () => {
    return createWatch('/db')
}
function createTuple<T>(t: Pt<T>, key: Partial<T>) {
    // the db in params needs to be org.db, maybe it should be server.org.db
    const params = useParams()

    // $ indicates a schema.table
    return createPresentation(t, params['schema'])
}
// the job page should show tasks that are running, and tasks that have run
const JobPage: Component = () => {
    const params = useParams()
    const [log] = createQuery(taskEntry)
    const title = "" // some kind of create tuple
    // const title = (): string => {
    //     if (log().loading) return "Loading"
    //     if (log().error) return log().error
    //     const v = log().value![0]
    //     return v.name + " " + mdate(v.start)
    // }
    return <Page>
        <Title back={`/db/${params['db']}`}>{title}</Title>
        <H2>Tasks</H2>
        <table class='table-auto'>
            <thead><tr><th>Name</th><th>Start</th><th>Duration</th><th>Output</th></tr></thead>
            <For each={rows(log())}>{task => <tr>
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
// a Database page is mostly a view of the database file system

// the jobview has to be a virtual table because of the calculation of the next job
// eventually we could use an anonymous iframe to do this calcuation, but for custom stuff golang might be easier.
const DatabasePage: Component = () => {
    const params = useParams()
    // we need a sort signal? parameters of any kind? return these as the setter?
    const [scripts] = createJobView()

    const navigate = useNavigate()
    const run = (name: string) => { }
    const showLog = (id: string) => navigate(`/db/${params['db']}/log/${id}`)

    return <Page >
        <Title back={'/'}>{params['db']}</Title>
        <Switch>
            <Match when={scripts().loading}>
                Loading
            </Match>
            <Match when={scripts().error}>
                {scripts().error}
            </Match>
            <Match when={true} >
                <H2>Jobs</H2>
                <table class='table-auto'>
                    <thead><tr><th>Name</th><th>Next Run</th><th></th></tr></thead>
                    <For each={rows(scripts())}>{(e, i) => {
                        return <tr class='hover:bg-neutral-500' >
                            <td class='border px-8 py-4'>{e.name}</td>
                            <td class='border px-8 py-4 w-64'>{e.next ? mdate(e.next) : ""}</td>
                            <td class='border px-8 py-4'><Button onClick={() => run(e.name)}>Run</Button></td>
                        </tr>
                    }}</For>
                </table>

        </Match></Switch>
    </Page>
}

// dbref is a table in ~ database, or should it be a folder of links? por que no los dos?
const DatabaseList: Component = () => {
    const [lst] = createDatabaseView()
    return <Show when={!lst().loading}><Page >
        <Title>Home</Title>
        <Body>
            <table class='table-auto'>
                <For each={entries(lst())}>{(e) => <tr><td>
                    <A href={`/db/${e}`}>{e.name}</A></td></tr>}
                </For >
                <A href='/add'>Add</A> <A class='ml-2' href='/profile'>Settings</A>
            </table>
        </Body>
    </Page></Show>
}
const ComingSoon: Component = () => {
    return <Page>
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
    return <Page>
        <Title>Settings</Title>
        <Center>
            <textarea class='w-full' placeholder='Add SSH key'></textarea>
            <BlueButton onClick={() => { }}>Add</BlueButton>
        </Center>
    </Page>
}
function App() {
    //const [items] =  createResource(props.fetch)
    return <>
        <Datagrove>
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
        </Routes></Datagrove></>
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


