import './index.css'
import { JSXElement, Component, createSignal, For, onMount, Show, createResource, Switch, Match, createEffect, Accessor } from 'solid-js'
import { render } from 'solid-js/web'
import { Route, Routes, Router, useNavigate, useParams, hashIntegration, Outlet } from "@solidjs/router"
import { BackNav, H2, Page, A, Body, Title, P, PageParams } from './lib/nav'
import { OrError, Rpc, profile } from './lib/socket'
import { LoginPage2, RecoveryPage } from './pages/login'
import { Datagrove, Presentation, Pt, createPresentation, rows } from './lib/db'
import { Dbref, dbref, taskEntry, } from './lib/schema'
import { BlueButton, Center } from './lib/form'
import { Folder, createWatch, entries } from './lib/dbf'
import { login, setWelcome, welcome } from './lib/crypto'
import { LoginPage } from './pages/one'
import { SitePage, SiteStore, setSite } from './layout/site_menu'

function mdate(n: number): string {
    return new Date(n).toLocaleDateString('en-us', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' })
}

const Button = (props: { children: JSXElement, onClick: () => void }) => {
    return <button class='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'>{props.children}</button>
}

// isolate this in case we change the api
// queries need a return row and a arguments
// in some cases the arguments can be complex.
function createQuery<R, A = {}>(t: Pt<R, A>, a?: A) {
    // the db in params needs to be org.db, maybe it should be server.org.db
    const params = useParams()
    // $ indicates a schema.table
    return createPresentation(t, params['schema'], a)
}

interface JobEntry extends File {
    path: string
    next: number
    recent: number
    recentLog: string
}
const createJobView = () => {
    return createQuery<JobEntry>({ table: 'job' })
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

const Welcome: Component = () => {
    return <div class='bg-blue-100 border-t border-b border-blue-500 text-blue-700 px-4 py-3' role='alert'>
        <div class='flex'>
            <p class='font-bold'>Welcome</p>
            <div class='flex-1' />
            <button onclick={() => setWelcome(false)}>X</button>
        </div>
        <p class='text-sm'>Your security settings can be accessed under the () icon. We have some suggestions for how you can be more secure. Also there are tools there to share your account across multiple devices</p>
    </div>
}


// dbref is a table in ~ database, or should it be a folder of links? por que no los dos?
const DatabaseList: Component = () => {
    const [lst] = createWatch("/")
    return <Show when={true}><Page >
        <Title>Home</Title>
        <Body>
            <Show when={false && welcome()}><Welcome /></Show>
            <table class='table-auto'>
                <For each={entries(lst())}>{(e) => <tr><td>
                    <A href={`/db/${e}`}>{e.name}</A></td></tr>}
                </For >

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

function Home() {
    const navigate = useNavigate();
    // redirect to current user's home page
    // this needs to be async to make a decision?

    if (!login())
        navigate('/~/login')
    else {
        navigate('/en/jim.hurd')
    }
    return <></>
}
function RouteGuard() {
    const navigate = useNavigate();

    createEffect(() => {
        // maybe token should be a session token or just a variable even.
        // should each tab need its own id? eventually we should use a sharedworker to log in. this sharedworker will keep a variable.
        if (!login()) {
            console.log('redirecting to login')
            navigate('/~/login', { replace: true });
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


export const js = (x: any) => JSON.stringify(x, null, 2)

function ProfilePage() {
    return <Page>
        <Title>Settings</Title>
        <Center>
            <textarea class='w-full' placeholder='Add SSH key'></textarea>
            <BlueButton onClick={() => { }}>Add</BlueButton>
        </Center>
    </Page>
}
const OrgPage: Component = () => {
    const params = useParams<PageParams>()
    return <Page>   <Title>Organizations</Title>
        <Center>
            <H2>{js(params)} Organization</H2>
        </Center></Page>
}
const DbPage: Component = () => {
    const params = useParams<{ org: string, db: string }>()
    return <Page>   <Title>Organizations</Title>
        <Center>
            <H2>{js(params)} Database</H2>
        </Center></Page>
}
const TablePage: Component = () => {
    const params = useParams<{ org: string, db: string, table: string, tag?: string }>()
    return <Page>   <Title>Organizations</Title>
        <Center>
            <H2>{js(params)} Table</H2>
        </Center></Page>
}
const FilePage: Component = () => {
    const params = useParams<{ org: string, db: string, path: string, tag?: string }>()
    return <Page>   <Title>Organizations</Title>
        <Center>
            <H2>js(params) file</H2>
        </Center></Page>
}
const OrgAccess: Component = () => {
    const params = useParams<{ org: string }>()
    return <Page>   <Title>Organizations</Title>
        <Center>
            <H2>{js(params)} Org Access</H2>
        </Center></Page>
}
const DbAccess: Component = () => {
    const params = useParams<{ org: string, db: string }>()
    return <Page>   <Title>Organizations</Title>
        <Center>
            <H2>{js(params)} Db accesss</H2>
        </Center></Page>
}


function NotFoundPage() {
    const p = useParams<{ path: string }>()
    return <div>Not found {p.path}</div>
}
function App2() {
    //const [items] =  createResource(props.fetch)
    return <>

        <Routes>
            <Route path="/" component={Home} />
            <Route path="/~/login" component={LoginPage} />
            <Route path="/~/login2" component={LoginPage2} />
            <Route path="/~/recover" component={RecoveryPage} />
            <Route path="/~/register" component={LoginPage} />
            <Route path="/" component={RouteGuard}>
                <Route path="/~/profile" component={ProfilePage} />
                <Route path="/~/add" component={ComingSoon} />

                <Route path="/:ln/:org" component={OrgPage} />
                <Route path="/:ln/:org/~/access" component={OrgAccess} />
                <Route path="/:ln/:org/:db/access" component={DbAccess} />
                <Route path="/:ln/:org/:db" component={DbPage} />

                <Route path="/:ln/:org/:db/t/:table" component={TablePage} />
                <Route path="/:ln/:org/:db/f/*path" component={FilePage} />
                <Route path="/:ln/:org/:db/log/:id" component={JobPage} />

                <Route path="/:ln/:org/:db/th/:tag/:table" component={TablePage} />
                <Route path="/:ln/:org/:db/fh/:tag/*path" component={FilePage} />
            </Route>
            <Route path="/*path" component={NotFoundPage} />
        </Routes></>
}

function App() {



    return <div>Hello, world</div>
}

const a = {
    title: "Aetna 1199",
    href: "",
    root: { name: "/", path: "/", children: [] } as SitePage,
    path: new Map<string, SitePage>(),
    search: [],
    sitemap: [
        {
            name: 'Tasks', // needs to be localized
            // we shouldn't have a path to sections, we just pick the first child
            children: [
                {
                    name: 'Periodic Tasks', path: '/en/jim.hurd'
                    , children: [
                        {
                            name: 'Process Files', path: '/en/jim.hurd', children: [
                                { name: 'All Files', path: '/en/jim.hurd' }]
                        },
                    ]
                },
                {
                    name: 'Settings', path: '/en/jim.hurd', children: [
                        {
                            name: 'Security', path: '/en/jim.hurd', children: [
                                { name: 'Login', path: '/en/jim.hurd' },
                                { name: 'Recover', path: '/en/jim.hurd' },
                                { name: 'Register', path: '/en/jim.hurd' },
                            ]
                        }
                    ]
                }
                ,],

        },
        {
            name: 'Learn',
            children: [
                {
                    name: 'Explanation', path: '/en/jim.hurd'
                    , children: [
                        {
                            name: 'Process Files', path: '/en/jim.hurd', children: [
                                { name: 'All Files', path: '/en/jim.hurd' }]
                        },
                    ]
                },
                {
                    name: 'How-to', path: '/en/jim.hurd'
                    , children: [
                        {
                            name: 'Process Files', path: '/en/jim.hurd', children: [
                                { name: 'All Files', path: '/en/jim.hurd' }]
                        },
                    ]
                },
                {
                    name: 'Tutorials', path: '/en/jim.hurd'
                    , children: [
                        {
                            name: 'Process Files', path: '/en/jim.hurd', children: [
                                { name: 'All Files', path: '/en/jim.hurd' }]
                        },
                    ]
                },
                {
                    name: 'Reference', path: '/en/jim.hurd', children: [
                        {
                            name: 'Security', path: '/en/jim.hurd', children: [
                                { name: 'Login', path: '/en/jim.hurd' },
                                { name: 'Recover', path: '/en/jim.hurd' },
                                { name: 'Register', path: '/en/jim.hurd' },
                            ]
                        }
                    ]
                }
            ],
        }
    ],
    language: {
        en: 'English',
        es: 'Español',
    }
}
console.log("s", JSON.stringify(a, null, 2))
setSite(a, '')


render(
    () => (
        <Router >
            <App2 />
        </Router>
    ),
    document.getElementById("app")!
)


