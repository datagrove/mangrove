import { useLocation } from "@solidjs/router"
import { Ln, allLn, en } from "../../i18n/src"
import { Accessor, JSXElement, createContext, createEffect, createSignal, useContext } from "solid-js"
import { ParentComponent } from "solid-js"
import { Icon } from "solid-heroicons";
import { language } from "solid-heroicons/solid";
import { useNavigate } from "@solidjs/router";


type Lang = { [key: string]: string }


const Select: ParentComponent<{
    entries: object
    value: string
    onChange: (e: string) => void
}> = (props) => {
    return (<div class='flex  text-black dark:text-white rounded-md items-center '>
        <label class='block mx-2' for='ln'>{props.children}</label>
        <select
            id='ln'
            value={props.value}
            aria-label="Select language"
            class='flex-1  rounded-md dark:bg-neutral-900 text-black dark:text-white '
            oninput={(e) => {
                const newLang = e.currentTarget.value
                props.onChange(newLang)
            }}
        >
            {Object.entries(props.entries).map(([code, name]) => (
                <option value={code}>
                    {name.lnd}&nbsp;&nbsp;&nbsp;
                </option>
            ))}
        </select>
    </div>
    );
};
export const LanguageSelect: ParentComponent<{}> = (props) => {
    const nav = useNavigate()
    const ln = useLn()

    // change the language has to change the route. It doesn't change the store
    const update = (e: string) => {
        const p = window.location.pathname.split('/')
        p[1] = e
        nav(p.join('/'))
    }

    return (<Select entries={allLn} value={ln().ln} onChange={update}>
        <Icon class='h-6 w-6' path={language} /></Select>)
}



export const I18nContext = createContext<Accessor<Ln>>()

export function LanguageProvider(props: { children: JSXElement }) {
    const loc = useLocation()
    const [ln, setLn] = createSignal<Ln>(en)
    createEffect(()=>{
        setLn(allLn[loc.pathname.split('/')[1]]??'en')
    })
    return <I18nContext.Provider value={ln}>
        {props.children}
    </I18nContext.Provider>
    return
}

export function useLn() {
    const r = useContext(I18nContext)
    if (!r) throw "why?"
    return r
}

export function lx(key: string): string {
    const l = allLn[key] ?? allLn['en']
    // @ts-ignore
    return l[key as keyof Ln] ?? key
}
