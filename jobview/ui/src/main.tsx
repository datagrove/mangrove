import './index.css'
import { JSXElement, Component, createSignal, For, onMount, Show, createResource, Switch, Match } from 'solid-js'
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
    summary: string
    type: string
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
            const n = Date.now()
            const h : SearchEntry[] = []
            for (let i = 0; i < 100; i++) {
                h.push({
                    name: "process",
                    start: n - i * 1000,
                    end: n - i * 1000 + 1000,
                    type: "job",
                    summary: "ran all tasks"
                })
            }
            // we need to periodically refresh this
            const jobs : Dash = {
                job: [
                    { 
                        "name": "process", 
                        "description": "Run all jobs"
                }
                ],
                runnable: [
                    { name: "process" ,
                        next: n + 24*60*60*1000}
                ],
                history: h
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

function mdate (n: number) : string {
    return  new Date(n).toLocaleDateString('en-us', {year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric'})
}

const Button = (props: {children: JSXElement}) => {
    return <button class='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'>{props.children}</button>
}
// we should show primary a list of logs, and maybe a drop down with jobs to run
// we should show a list of jobs that will be run on a timer
// we should show a list of jobs that have been run
const DatabasePage : Component = () => {
    const params = useParams()
    const [jobs] = createResource(params['db'], cn.get<Dash>('dash'))
    return <Page title={params['db']} back={'/'} >
        <Switch>
            <Match when={!jobs()}>
                Loading
            </Match>
            <Match when={jobs()!.error}>
                {jobs()!.error}
            </Match>
        <Match when={true} >
        <H2>Jobs</H2>
        <table class='table-auto'>
            <thead><tr><th>Name</th><th>Next Run</th><th></th></tr></thead>
            <For each={jobs()!.value!.runnable}>{(e,i) => {
                return <tr>
                    <td class='border px-8 py-4'>{e.name}</td>
                    <td class='border px-8 py-4 w-64'>{e.next?mdate(e.next):""}</td>
                    <td class='border px-8 py-4'><Button>Run</Button></td>
                </tr>
            }}</For>
        </table>

        <H2>Recent</H2>
        <table class='table-auto'>
            <thead><tr><th>Start</th><th>End</th><th>Name</th><th>Summary</th></tr></thead>
        <For each={jobs()!.value!.history}>{(e) => {
            return <tr>
                <td class='border px-8 py-4'>{mdate(e.start)}</td>
                <td class='border px-8 py-4'>{mdate(e.end)}</td>
                <td class='border px-8 py-4'>{e.name}</td>
                <td class='border px-8 py-4'>{e.summary}</td></tr>
        }}</For>
        </table></Match></Switch>
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

