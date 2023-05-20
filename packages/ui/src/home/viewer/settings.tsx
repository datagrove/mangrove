import { Icon } from "solid-heroicons";
import { chevronRight, language, cog_6Tooth as gear } from "solid-heroicons/solid";
import { createSignal, Show } from "solid-js";
import { LanguageSelect } from "../../i18n/i18";
import { A } from "../../core/dg";
import { Ab } from "../..";
import { Cell } from "@lexical/table";
import { Form } from "../../form";
import { usePage } from "../../core";

// static generated
const creatingSettings = () => createLens("settings", {
    fname: {}
})
function SettingsPage1() {
    const r = creatingSettings()
    return createForm(db, [
        fcell(r.fname, { name: "", type: "text" }),
        fcandy("submit")
    ])
}


// the type of the document might as well be in the reference (forced file extensions)
// faking it buys attacker nothing, since document won't be found. t
export function SettingsViewer() {
    const page = usePage()
    const path = page.doc.path
    // for internal forms like this we can use the path as arbitrary key
    // some people will want the ability to use when impersonating a database
    // we need to build a form that points to the users stored settings.
    // potentially do nothing though? Form itself may have placeholder for "current user"
    return <Switch>

    </Switch>
}


export const SitePicker2 = () => {
    const [collapsed, setCollapsed] = createSignal(true);

    return (
        <div class="mt-2 border border-solid-lightitem bg-solid-light dark:bg-solid-dark dark:border-solid-darkitem rounded-lg">
            <button
                onClick={() => setCollapsed((prev) => !prev)}
                aria-controls="preferences"
                type="button"
                class="flex items-center justify-between p-2 w-full cursor-pointer"
            >
                <div class="flex items-center gap-2 font-semibold">
                    <div class="bg-solid-lightitem dark:bg-solid-darkitem rounded-lg p-1">
                        <Icon path={gear} class="w-4 h-4" />
                    </div>
                    Preferences
                </div>
                <Icon path={chevronRight}
                    class={`w-6 h-6 text-solid-lightaction dark:text-solid-darkaction transform transition ${!collapsed() ? "rotate-90" : ""
                        }`}
                />
            </button>
            <Show when={!collapsed()}>
                <div aria-label="preferences" class="p-4 border-t border-solid-lightitem dark:border-solid-darkitem">

                    <div class='flex items-center'><div class='flex-1'><LanguageSelect>
                        <Icon class='h-5 w-5' path={language} />
                    </LanguageSelect></div><div class='flex-none'></div></div>
                    <div class='flex'><div class='flex-1'></div></div>
                </div>
            </Show>
        </div>
    );
}



// language selector
export const SitePreference = () => {
    const [collapsed, setCollapsed] = createSignal(true);

    return (
        <div class="mt-2 border border-solid-lightitem bg-solid-light dark:bg-solid-dark dark:border-solid-darkitem rounded-lg">
            <button
                onClick={() => setCollapsed((prev) => !prev)}
                aria-controls="preferences"
                type="button"
                class="flex items-center justify-between p-2 w-full cursor-pointer"
            >
                <div class="flex items-center gap-2 font-semibold">
                    <div class="bg-solid-lightitem dark:bg-solid-darkitem rounded-lg p-1">
                        <Icon path={gear} class="w-4 h-4" />
                    </div>
                    Preferences
                </div>
                <Icon path={chevronRight}
                    class={`w-6 h-6 text-solid-lightaction dark:text-solid-darkaction transform transition ${!collapsed() ? "rotate-90" : ""
                        }`}
                />
            </button>
            <Show when={!collapsed()}>
                <div aria-label="preferences" class="p-4 border-t border-solid-lightitem dark:border-solid-darkitem">

                    <div class='flex items-center'><div class='flex-1'><LanguageSelect>
                        <Icon class='h-5 w-5' path={language} />
                    </LanguageSelect></div><div class='flex-none'></div></div>
                    <div class='flex'><div class='flex-1'></div></div>
                </div>
            </Show>
        </div>
    );
}
