import { JSX, createSignal } from "solid-js"

export const [ln, setLn] = createSignal("en")
export const [nav, setNav] = createSignal("/")

export function simpleRouter(){
    // simple router that only looks at hash
    const router = () => {
        let route = window.location.hash.slice(1) || "/en/"
        let sp = route.split('/')
        console.log("route", route, sp)
        setLn(sp[1])
        setNav(sp[2])
    }
    window.addEventListener('load', router);
    window.addEventListener('hashchange', router);
}

export function A(props: any) {
    return <a {...props}>{props.children}</a>
}
export function NavLink(props: any) {
    return <div/>
  }
export function navigate(path: string, options?: any) {
  //navigate('/', { replace: true });
    window.location.hash = path
}

export const useNavigate = () => navigate

export interface AnchorProps extends Omit<JSX.AnchorHTMLAttributes<HTMLAnchorElement>, "state"> {
    href: string;
    replace?: boolean;
    noScroll?: boolean;
    state?: unknown;
    inactiveClass?: string;
    activeClass?: string;
    end?: boolean;
}

export interface Location<T=any> {
    hash: string;
}
export function useLocation<T>(): Location<T> {
    return { hash: "" }
}

export function useParams<T>(): T {
    return {} as T
}