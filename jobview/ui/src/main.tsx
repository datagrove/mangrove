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
    description?: string
    schema?: string
}
interface Runnable {
    name: string
    args?: string
    next?: number // unix time
}
// each search entry covers a time range
interface SearchEntry {
    name: string
    start: number // unix time
    end: number
}

// return 100 most recent runs, link for more
// searching should be done for all databases
// dry run would be a good feature
interface Dash {
    job: Job[]
    runnable: Runnable[]
    history: SearchEntry[]
}

const mockWs = new MockWs((data: Rpc<any>) => {
    switch(data.method) {
        case 'init':  // the job runner should define this api to get title, options, etc.
            return {title: 'Mock Job View'}

        // in general we want to subscribe to this sort of thing? refresh ok, not ideal
        case 'container':
            return ['Production', 'Test']
        case 'dash':
            // we need to periodically refresh this
            const jobs : Dash = {
                job: [
                    { "name": "process", 
                    "description": "Run all jobs"
                }
                ],
                runnable: [
                    { name: "process" }
                ],
                history: [
                    {
                ]
            }
            return jobs
        case 'search':
            // we need to set the date range on this
            // would be nice to filter
            const more : SearchEntry[] = []
            return more
        default:
            console.log("unknown method", data)
    }
})
const cn = new Cn(mockWs)


// we should show primary a list of logs, and maybe a drop down with jobs to run
// we should show a list of jobs that will be run on a timer
// we should show a list of jobs that have been run
const DatabasePage : Component = () => {
    const params = useParams()
    const [jobs] = createResource(params['db'], cn.get<Dash>('dash'))
    return <Page title={params['db']} back={'/'} >
        <select>
            <For each={jobs()?.value?.runnable}>{(e,i)=>{
                return <option value={e.name}>e.name</option>
            }}</For>
            </select><button>Run</button>

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

