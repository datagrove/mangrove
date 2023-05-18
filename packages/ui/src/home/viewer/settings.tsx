import { Icon } from "solid-heroicons";
import { chevronRight, language, cog_6Tooth as gear } from "solid-heroicons/solid";
import { createSignal, Show } from "solid-js";
import { LanguageSelect } from "../../i18n/i18";
import { A } from "../../core/dg";
import { Ab } from "../..";

export function SettingsViewer() {

    return <div>Settings</div>
}

export const SitePicker = () => {
    return <div>
            <div class='text-xl p-1'>CS Lewis Notes</div>
            <div class='text-sm ml-2 mb-4'><Ab href='#'>by Datagrove</Ab></div>
        </div>

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
