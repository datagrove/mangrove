import { ParentComponent, createSignal } from "solid-js"
import { useNavigate, useParams } from "@solidjs/router";
import { Icon } from "solid-heroicons";
import { language } from "solid-heroicons/solid";

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

    return (<div class='flex text-black dark:text-white p-2 mr-2 rounded-md items-center space-x-2'>
        <label for='ln'>{props.children}</label>
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
    const p = useParams<{ ln: string }>();
    const nav = useNavigate()

    // change the language has to change the route. It doesn't change the store
    const update = (e: string) => {
        nav(`/${e}/${window.location.pathname.slice(4)}`)
    }
    return (<Select entries={lang()} value={p.ln} onChange={update}>
        <Icon class='h-6 w-6' path={language} /></Select>)
}

