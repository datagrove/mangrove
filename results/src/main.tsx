import './index.css'
import { JSXElement, Component, createSignal, For, onMount, Show } from 'solid-js'
import { render } from 'solid-js/web'
import { Route, Routes, Router, A, useNavigate, useParams, hashIntegration } from "@solidjs/router"
import { BackNav, H2 } from './nav'
import 'highlight.js/styles/github.css'
import hljs from 'highlight.js/lib/core'
import gherkin from 'highlight.js/lib/languages/gherkin'
hljs.registerLanguage('gherkin', gherkin)


export const PreCard: Component<{ children: JSXElement }> = (props) => {
    return <div class='block bg-white dark:bg-gray-800 rounded-md shadow-md p-4 mt-4'>
        <pre class="w-full overflow-y-auto  font-normal text-gray-700 dark:text-gray-400">{props.children}</pre>
    </div>
}
export const Card: Component<{ children: JSXElement }> = (props) => {
    return <div class='block break-all bg-white dark:bg-gray-800 rounded-md shadow-md p-4 mt-4'>
        {props.children}
    </div>
}

export const A2: Component<{ children: JSXElement, href: string }> = (props) => {
    return <a class='text-blue-700 hover:underline hover:text-blue-600 cursor-pointer' {...props}>{props.children}</a>
}

const url = new URL(location.href);
const hostRoot = `${url.protocol}//${url.hostname}:${url.port}`

async function fetchExists(url: string) {
    const res = await fetch(url,
        { method: "HEAD" }
    )
    return res.ok;
}
async function fetchDefault(url: string, def: string) {
    try {
        const f = await fetch(url)
        if (f.status == 404) return def
        return await f.text();
    } catch (e) {
        return def
    }
}
const TestView: Component = (props) => {
    const p = useParams<{ run: string, id: string }>()
    const f = "/TestResults/" + p.run + "/" + p.id
    const [log, setLog] = createSignal<string>('')
    const [source, setSource] = createSignal<string>('')
    const [stack, setStack] = createSignal<string>('')
    const [trace, setTrace] = createSignal<boolean>(false)

    onMount(async () => {
        // log and source are always there, stack is optional. trace is optional
        setTrace(await fetchExists(f + ".zip"))
        setLog(await (await fetch(f + ".txt")).text());
        setStack(await fetchDefault(f + ".error", ''));
        // format the code
        var src = await (await fetch(f + ".feature")).text()
        var x = hljs.highlight(src, {
            language: 'gherkin'
        }).value;
        setSource(x);
    })

    return <><BackNav back={true}>{p.id}</BackNav>
        <div class='m-2'>
            <Show when={trace()}>
                <p><A2 href={'/traceViewer/index.html?trace=' + hostRoot + f + '.zip'}>View Trace</A2></p><p> <A2 href={f + '.zip'}>Download Trace</A2></p></Show>
            <Show when={stack()}>
                <PreCard>{stack()}</PreCard>
            </Show>
            <PreCard>{log()}</PreCard>

            <div class='mt-4 rounded-md bg-neutral-500yes' >
                <pre class='whitespace-pre' innerHTML={source()}>
                </pre>
            </div>

        </div>
    </>
}
// One  set of test results.
const TestList: Component<{ test: string[], color: string, run: string, waiting?: boolean }> = (props) => {
    const navigate = useNavigate()
    return <>
        <div class='pl-2 pr-2 mt-2 overflow-hidden'>
            <div class="relative overflow-x-auto shadow-md sm:rounded-lg">
                <table class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" class="px-6 py-3">
                                Test
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <For each={props.test}>{(e, i) => {
                            const x = '/test/' + props.run + "/" + e;
                            return <><Show when={!props.waiting}><tr onClick={() => navigate(x)} class="cursor-pointer bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <td class="px-6 py-4 font-medium text-gray-900  dark:text-white">
                                    <A class={`${props.color} whitespace-nowrap`} href={x}>{e}</A>
                                </td>
                            </tr></Show>
                                <Show when={props.waiting}><tr class="cursor-pointer bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <td class="px-6 py-4 font-medium text-gray-900  dark:text-white">
                                        {e}
                                    </td>
                                </tr></Show></>
                        }}</For>
                    </tbody>
                </table>
            </div>
        </div></>
}
const RunResults: Component<{}> = (props) => {
    const [passed, setPassed] = createSignal<string[]>([])
    const [failed, setFailed] = createSignal<string[]>([])
    const [waiting, setWaiting] = createSignal<string[]>([])
    const id = useParams().id
    onMount(async () => {
        const run = await (await fetch('/api/run/' + id)).json()
        const x = Array.from(Object.entries(run)) as [string, string][]

        setPassed(x.filter(e => e[1] == "pass").map(e => e[0]))
        setFailed(x.filter(e => e[1] == "fail").map(e => e[0]))
        setWaiting(x.filter(e => e[1] == "waiting").map(e => e[0]))
    })


    return <><BackNav back={false} >
        V10 <a href='#passed'>{passed().length} passed</a>, {failed().length} failed, {waiting().length} waiting
    </BackNav>

        <H2>Failed</H2>
        <TestList color='text-red-500' test={failed()} run={id} />
        <a id='passed'><H2>Passed</H2></a>
        <TestList color='' test={passed()} run={id} />
        <a id='waiting'><H2>Waiting</H2></a>
        <TestList color='' test={waiting()} waiting={true} run={id} />
    </>
}

const RunList: Component = () => {
    const [runs, setRuns] = createSignal<string[]>([]);
    onMount(async () => {
        setRuns(await (await fetch("/api/runs")).json())
    })
    return <><BackNav back={false} >
        Runs
    </BackNav>
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
            <Route path="/run/:id" component={RunResults} />
            <Route path="/test/:run/:id" component={TestView} />
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

