import { useNativeColorScheme } from "solid-headless"
import { ParentComponent, createSignal } from "solid-js"
import { PageDescription } from "./site_menu"
import { useNavigate, useParams } from "@solidjs/router";
import { Select } from "../core/select";
import { Icon } from "solid-heroicons";
import { language } from "solid-heroicons/solid";

type Lang = { [key: string]: string }

const [lang, setLang] = createSignal<Lang>({
    "en": "English",
    "es": "Español",
    "iw": "עברית"
})
export const rtlLang = {
    "iw": true
}

export const LanguageSelect: ParentComponent<{}> = (props) => {
    const p = useParams<{ ln: string }>();
    const nav = useNavigate()

    // change the language has to change the route. It doesn't change the store
    const update = (e: string) => {
        nav(`/${e}/${window.location.pathname.slice(4)}`)
    }
    return (<Select entries={lang()} value={p.ln} onchange={update}>
        <Icon class='p-2 h-5 w-5' path={language} /></Select>)
}