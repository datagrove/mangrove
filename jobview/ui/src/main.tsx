import './index.css'
import { JSXElement, Component, createSignal, For, onMount, Show, createResource } from 'solid-js'
import { render } from 'solid-js/web'
import { Route, Routes, Router, A, useNavigate, useParams, hashIntegration } from "@solidjs/router"
import { BackNav, H2 } from './widget/nav'
import { Cn, ListView, MockWs, OrError, Page, Rpc, Ws } from './widget/list'

//const ws = new Ws('ws://localhost:8080/ws')

interface JobView {
    title: string
}
var jv:JobView = {title: 'Job View'}

interface Job {
    name: string
    description: string
    schema: string
}
interface Runnable {
    name: string
    args: string
}
interface HistoryEntry {
    name: string
    start: number // unix time
    end: number
}
interface Scheduled {
    name: string   // runnable
    next: number // unix time
    args: string
}
// return 100 most recent runs, link for more
interface Jobs {
    job: {
        [name: string]: Job
    },
    run: Runnable[]
    schedule: Scheduled[]
    history: HistoryEntry[]
}

const mockWs = new MockWs((data: Rpc<any>) => {
    switch(data.method) {
        case 'init':  // the job runner should define this api to get title, options, etc.
            return {title: 'Mock Process'}
        case 'container':
            return ['Production', 'Test']
        case 'jobs':
            // we need to periodically refresh this
            const jobs : Jobs = {
                job: {},
                run: [],
                schedule: [],
                history: []
            }
            return jobs
        case 'search':
            // we need to set the date range on this
            // would be nice to filter
            const more : HistoryEntry[] = []
            return more
        default:
            console.log("unknown method", data)
    }
})
const cn = new Cn(mockWs)

// home page is going to be a list of jobs that can be run and a history of jobs that have been run
// maybe show schedule for next time job will run
// maybe show a list of running jobs
const RunList: Component = () => {
    const [runs, setRuns] = createSignal<string[]>([]);
    onMount(async () => {
        setRuns(await (await fetch("/api/runs")).json())
    })
    return <><BackNav back={false} >
        1199 Process
    </BackNav>
    <h2>Jobs</h2>
    <button onClick={()=>{}}>Run</button>
    <H2>Runs</H2>
        <div class='m-2'>
            <For each={runs()}>{
                (e, i) => <div><A href={`/run/${e}`}>{e}</A></div>
            }</For></div>
    </>
}

// we should show primary a list of logs, and maybe a drop down with jobs to run
// we should show a list of jobs that will be run on a timer
// we should show a list of jobs that have been run
const DatabasePage : Component = () => {
    const params = useParams()
    const [jobs] = createResource(params['db'], cn.get<string[]>('jobs'))
    return <Page title={params['db']} back={'/'} >
        

        </Page>
}
const DatabaseList : Component = () => {
    return <Page title={jv.title}>
        <ListView fetch={cn.get<string[]>('container')}>{(e) => <tr><td>
            <A href={`/db/${e}`}>{e}</A></td></tr>}
        </ListView >
        </Page>
}

function App() {
    return <>
        <Routes>
            <Route path="/" component={DatabaseList} />
            <Route path="/db/:db" component={DatabasePage} />
        </Routes></>
}

/*
function launch(e: OrError<JobView>) {
    if (e.value) {
        jv = e.value
        render(
            () => (
                <Router source={hashIntegration()}>
                    <App></App>
                </Router>
            ),
            document.getElementById("app")!
        )
    }
}

launch(await cn.get<JobView>('init')())
*/
render(
    () => (
        <Router source={hashIntegration()}>
            <App></App>
        </Router>
    ),
    document.getElementById("app")!
)

