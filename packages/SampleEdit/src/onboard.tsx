import { createSignal } from "solid-js"
import { LanguageSelect, useLn } from "../../i18n-solid/src"
import { SimplePage } from "../../login-solid/src"
import { Ab, Abln, Center, DarkButton } from "../../ui-solid/src"
import {  Transition }  from 'solid-headless'
import { paperClip } from 'solid-heroicons/solid'
import { Icon } from "solid-heroicons"

// CalendarIcon, PaperClipIcon, TagIcon, UserCircleIcon

const PaperClipIcon = (props: {class:string})=><Icon class={props.class} path={paperClip}/>

export function CreateFirst() {
   const ln = useLn()
   // @ts-ignore
   return <><div dir={ln().dir} class='px-2 space-x-1 my-2 fixed w-screen flex flex-row items-center'>
      <div><Abln href='login'>{ln().signin}</Abln></div>
      <div class='flex-1 ' />
      <div class='w-48 '><LanguageSelect /></div>
      <DarkButton />
      <Ab href='#'>{ln().help}</Ab>
   </div>
      <Center>

         <h1 class='w-full text-center mt-16 mb-8'>Datagrove</h1>
         <form action="#" class="relative">
      <div class="overflow-hidden rounded-lg border border-gray-300 shadow-sm focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
        <label for="title" class="sr-only">
          Title
        </label>
        <input
         autofocus
          type="text"
          name="title"
          id="title"
          class="block w-full border-0 pt-2.5 text-lg font-medium placeholder:text-gray-400 focus:ring-0 dark:bg-black"
          placeholder="Name your website (optional)"
        />
        <label for="description" class="sr-only">
          Description
        </label>
        <textarea
          rows={2}
          name="description"
          id="description"
          class="block w-full resize-none dark:text-white dark:bg-black border-0 py-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
          placeholder="Description (optional)"
          value={''}
        />


      <div class="flex items-center bg-white dark:bg-black justify-between space-x-3 border-t border-gray-200 px-2 py-2 sm:px-3">
          <div class="flex">
            <button
              type="button"
              class="group -my-2 -ml-2 inline-flex items-center rounded-full px-3 py-2 text-left text-gray-400"
            >
              <PaperClipIcon class="-ml-1 mr-2 h-5 w-5 group-hover:text-gray-500" aria-hidden="true" />
              <span class="text-sm italic text-gray-500 group-hover:text-gray-600">Add files (optional)</span>
            </button>
          </div>
          <div class="flex-shrink-0">
            <button
              type="submit"
              class="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Create
            </button>
          </div>
        </div>
        </div>
    </form>


      </Center></>


}



