import { ParentComponent, createSignal } from "solid-js"
import { Icon } from "solid-heroicons";
import { language } from "solid-heroicons/solid";
import { useLn } from "../login/passkey_i18n";
import { useNavigate } from "@solidjs/router";

type Lang = { [key: string]: string }

const [lang, setLang] = createSignal<Lang>({
    "en": "English",
    "es": "Español",
    "iw": "עברית"
})
export const rtlLang = {
    "iw": true,
    'ar': true
}
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
                    {name}&nbsp;&nbsp;&nbsp;
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

    return (<Select entries={lang()} value={ln().ln} onChange={update}>
        <Icon class='h-6 w-6' path={language} /></Select>)
}

