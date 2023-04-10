import './index.css'
import { JSXElement, Component, createSignal, For, onMount, Show } from 'solid-js'
import { render } from 'solid-js/web'
import { Route, Routes, Router, A, useNavigate, useParams, hashIntegration } from "@solidjs/router"
import { BackNav, H2 } from './nav'

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

function App() {
    return <>
        <Routes>
            <Route path="/" component={RunList} />
        </Routes></>
}
render(
    () => (
        <Router source={hashIntegration()}>
            <App></App>
        </Router>
    ),
    document.getElementById("app")!
);

