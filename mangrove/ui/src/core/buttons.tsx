import { Icon } from "solid-heroicons";
import { xCircle } from "solid-heroicons/solid";
import { JSX } from 'solid-js'

export function CloseButton() {
  return <Icon path={xCircle} class='flex-none w-5 h-5 text-blue-700 hover-text-blue-500' />
}

export function Kbd(props: { children?: JSX.Element }) {
  return (<kbd
    class="h-6 w-6 border border-transparent mr-1 white dark:bg-neutral-800 text-neutral-500 p-0 inline-flex justify-center items-center  text text-center rounded"
    {...props}
  />
  );
}
