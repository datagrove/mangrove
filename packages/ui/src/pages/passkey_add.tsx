import { Icon } from "solid-heroicons";
import { key } from "solid-heroicons/solid";
import { createSignal, onMount, Show } from "solid-js";
import { Center, BlueButton, LightButton } from "../lib/form";
import { useLn } from "./passkey_i18n";

export const AddPasskey = () => {
    const [ln, dir] = useLn()
    const [open, setOpen] = createSignal(true);
    let btnSaveEl: HTMLButtonElement | null = null;
    
    onMount( () => {
        btnSaveEl!.focus()
    })

    const add = () => {
         setOpen(false) }
    const notNow = () => { setOpen(false) }
    const notEver = () => { setOpen(false) }

    const submit = (e: any) => {
        e.preventDefault();
        setOpen(false);
    }
    return <>
        <Show when={open()}>
            <div
                class="fixed  inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full"
                id="my-modal"
                onClick={() => setOpen(false)}
                role="presentation"
            >
                <Center>
                    <div class="mx-auto p-5 border w-96 shadow-lg rounded-md dark:bg-black bg-white">
                        <div class="space-y-6 ">

                            <Icon path={key} class="w-24 h-24 mx-auto" />
                            <p >{ln().addPasskey1}</p>
                            <p class='text-neutral-500'>{ln().addPasskey2}</p>
                            <form onSubmit={submit} class="space-y-6">
                                <BlueButton  ref={btnSaveEl!} onClick={add}>{ln().add}</BlueButton>
                                <LightButton onClick={notNow}>{ln().notNow}</LightButton>
                                <LightButton onClick={notEver}>{ln().notEver}</LightButton>
                            </form>

                        </div></div></Center>
            </div>
        </Show>
    </>

};