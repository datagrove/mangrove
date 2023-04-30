import { Show, createSignal, onMount } from "solid-js";
import { BlueButton, Center, LightButton } from "../lib/form";
import { Icon } from "solid-heroicons";
import { key } from "solid-heroicons/solid";
import { useLn } from "./passkey_i18n";
import { AddPasskey } from "./passkey_add";


export const TestPage = () => {
    return <AddPasskey />
}

/*
        <Dismiss
          menuButton={btnEl}
          open={open}
          setOpen={setOpen}
          modal
          focusElementOnOpen={() => btnSaveEl}
        >*/