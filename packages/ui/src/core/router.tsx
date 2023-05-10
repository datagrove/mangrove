import { Component, JSX, JSXElement, Match, Switch, createEffect, createSignal, onCleanup } from "solid-js"


const useHash = true
export function setPath(path: string) {
    if (useHash) {
        window.location.hash = path
    } else {
        console.log("pushState", path)
        window.history.pushState(null, "", path)
    }
}

// these need to be signals or not?
// the event handler will trigger a re-render when it changes, that will set these values
export const [ln, setLn_] = createSignal("en")
export const [loc, setLoc] = createSignal("/")

export function hashPath(path: string) {
    if (useHash) {
        console.log("hashPath", ln(), loc(), path)
        return "#/" + ln() + loc().split('/').slice(0,-1).join('/') + "/"+ path
    } else return path
}
export function useNavigate() {
    return (path: string, options?: { replace?: boolean, external?: boolean }) => {
        if (options?.external) {
            location.href = path
            return
        }
        if (useHash) {
            location.hash = hashPath(path)
            return
        }
        if (!path.startsWith('/')) {
            // relative path
            path = loc() + path
        }
        console.log("navigate", path)
        setPath("/" + ln() + path)
    }
}
const nav = useNavigate()

export type Params = Record<string, string>;
export interface Path {
    pathname: string;
    search: string;
    hash: string;
}
export interface Location<S = unknown> extends Path {
    query: Params;
    state: Readonly<Partial<S>> | null;
    key: string;
}
export function useLocation<T>() {
    return () => {
        return {
            pathname: loc(),
            search: "",
            hash: ""
        } as Location<T>
    }
}

export function setLn(n: string) {
    setLn_(n)
    if (useHash) {
        window.location.hash = "/" + n + loc()
    } else {
        window.history.pushState({}, "", "/" + n + loc())
    }
}

const router = (e: any) => {
    e.preventDefault()
    const root = ""
    let route = "/"
    if (useHash) {
        route = window.location.hash
    } else {
        route = window.location.pathname.slice(root.length)
    }
    let sp = route.split('/')
    let l = sp[1]
    let p = "/" + sp.slice(2).join('/')
    setLn_(l ? l : "en")
    setLoc(p ? p : "/")
    //window.location.hash = "/" + l + p
    console.log("route", {
        "route": route,
        "ln": l,
        "path": p
    })
}
export let root: string
// the page this loads from is the root, so when we navigate outside the root we need to let the browser handle it

export const Router = (props: { children: JSXElement }) => {
    root = location.href
    createEffect(() => {
        window.addEventListener('load', router);
        window.addEventListener('popstate', (e)=>{
            e.preventDefault()
            router(e)
        })
        window.addEventListener('hashchange', router);
    })
    onCleanup(() => {
        window.removeEventListener('load', router);
        window.removeEventListener('hashchange', router);
    })

    return <>{props.children}</>
}
export const Routes = Switch

export const Route = (props: { path: string, component: Component<any> }) => {
    return <Match when={(loc() == props.path)}>
        <props.component />
    </Match>
}
export const DefaultRoute: Component<{ children: JSXElement }> = (props) => {
    return <Match when={true}>
        {props.children}
    </Match>
}
// export function A(props: any) {
//     const navigate = useNavigate()
//     return <a {...props} onClick={(e) => { navigate(props.href) }}>{props.children}</a>
// }
export const A = (props: { href: string, children: JSXElement }) => {
    const click = (e: any) => {
        e.preventDefault()
        nav(props.href)
    }
    return <a>{props.children}</a>
}
export function NavLink(props: any) {
    return <div />
}

export interface AnchorProps extends Omit<JSX.AnchorHTMLAttributes<HTMLAnchorElement>, "state"> {
    href: string;
    replace?: boolean;
    noScroll?: boolean;
    state?: unknown;
    inactiveClass?: string;
    activeClass?: string;
    end?: boolean;
}



export function useParams<T>(): T {
    return {} as T
}