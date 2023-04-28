import './index.css'
import { JSXElement, Component, createSignal, For, Show, Switch, Match, createEffect } from 'solid-js'
import { render } from 'solid-js/web'
import { Route, Routes, Router, useNavigate, useParams, Outlet } from "@solidjs/router"
import { H2, Page, A, Body, Title, P, PageParams } from './layout/nav'
import { LoginPage2, RecoveryPage } from './pages/login'
import { Pt, createPresentation, rows } from './lib/db'
import { taskEntry, } from './lib/schema'
import { BlueButton, Center, ToggleSection } from './lib/form'
import { createWatch, entries } from './lib/dbf'
import { createUser, generatePassPhrase, login, security, welcome, profile, Site } from './lib/crypto'
import { LoginPage } from './pages/one'
import { Settings } from './lib/secure'
import { PasswordManager } from './pages/pass'
import { LoginPass, PassworOrBip39 } from './pages/pass2'
import { LoginPasskey, Passkey } from './pages/passkey'

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



// dbref is a table in ~ database, or should it be a folder of links? por que no los dos?
const DatabaseList: Component = () => {
    const [lst] = createWatch("/")
    return <Show when={true}><Page >
        <Title>Home</Title>
        <Body>

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
const [lang, setLang] = createSignal('en')

const OrgPage = () => {
    const nav = useNavigate()
    const params = useParams<PageParams>()
    return <Page>   <Title>Organizations</Title>
        Home page
        This should show a list of databases linked to the user.
    </Page>
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
interface FieldDesc {
    header: string
}
function DbTable<T>(fields: (string | FieldDesc)[]) {
    return (props: { for: T[] }) => {
        return <table>
            <tbody>
                <For each={props.for}>{(e: any) => {
                    return <tr>
                        <For each={fields}>{(f) => {
                            if (typeof f == 'string') {
                                return <td>{e[f]}</td>
                            } else {
                                return <td>{f.header}</td>
                            }
                        }}</For>
                    </tr>
                }}</For>
            </tbody>
        </table>
    }
}
const SiteTable = DbTable<Site>(['name'])

// displays the users root profile: orgs, dbs, files, etc
function Home() {
    return <Page>
        <Title>Home</Title>
        <Body>
            <H2>Web Sites</H2>
            <SiteTable for={profile().site} />
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
    const navigate = useNavigate();

    createEffect(() => {
        // maybe token should be a session token or just a variable even.
        // should each tab need its own id? eventually we should use a sharedworker to log in. this sharedworker will keep a variable.
        if (!login()) {
            console.log('redirecting to login')
            navigate('/login', { replace: true });
        } else {
            navigate(`/${lang()}`, { replace: true });
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
            <Route path="/:ln/login" component={LoginPasskey} />
            <Route path="/:ln/register" component={Passkey} />
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
