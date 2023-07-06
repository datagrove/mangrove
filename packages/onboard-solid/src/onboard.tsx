import { createSignal } from "solid-js"
import { LanguageSelect, useLn } from "../../i18n-solid/src"
import { SimplePage } from "../../login-solid/src"
import { Ab, Center, DarkButton } from "../../ui-solid/src"
import {  Transition }  from 'solid-headless'
import {  } from 'solid-heroicons/solid'
// CalendarIcon, PaperClipIcon, TagIcon, UserCircleIcon


export function Onboard() {
   const ln = useLn()
   // @ts-ignore
   return <><div dir={ln().dir} class='px-2 space-x-1 my-2 fixed w-screen flex flex-row items-center'>
      <div><Ab href='#'>{ln().signin}</Ab></div>
      <div class='flex-1 ' />
      <div class='w-48 '><LanguageSelect /></div>
      <DarkButton />
      <Ab href='#'>{ln().help}</Ab>
   </div>
      <Center>

         <h1 class='w-full text-center mt-16 mb-8'>Datagrove</h1>



      </Center></>


}

/*
  This example requires some changes to your config:
  
  ```
  // tailwind.config.js
  module.exports = {
    // ...
    plugins: [
      // ...
      require('@tailwindcss/forms'),
    ],
  }
  ```
*/

const useState = createSignal



const assignees = [
  { name: 'Unassigned', value: null },
  {
    name: 'Wade Cooper',
    value: 'wade-cooper',
    avatar:
      'https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
  // More items...
]
const labels = [
  { name: 'Unlabelled', value: null },
  { name: 'Engineering', value: 'engineering' },
  // More items...
]
const dueDates = [
  { name: 'No due date', value: null },
  { name: 'Today', value: 'today' },
  // More items...
]

function classs(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

function Listbox(props: any) {
   return <div/>
}
Listbox.Label = (props: any) =>{
   return <div/>
}
Listbox.Button = (props: any) =>{
   return <div/>
}
Listbox.Options = (props: any) => {
   return <div/>
}

export default function Example() {
  const [assigned, setAssigned] = useState(assignees[0])
  const [labelled, setLabelled] = useState(labels[0])
  const [dated, setDated] = useState(dueDates[0])

  return (
    <form action="#" class="relative">
      <div class="overflow-hidden rounded-lg border border-gray-300 shadow-sm focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
        <label for="title" class="sr-only">
          Title
        </label>
        <input
          type="text"
          name="title"
          id="title"
          class="block w-full border-0 pt-2.5 text-lg font-medium placeholder:text-gray-400 focus:ring-0"
          placeholder="Title"
        />
        <label for="description" class="sr-only">
          Description
        </label>
        <textarea
          rows={2}
          name="description"
          id="description"
          class="block w-full resize-none border-0 py-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
          placeholder="Write a description..."
          value={''}
        />

        {/* Spacer element to match the height of the toolbar */}
        <div aria-hidden="true">
          <div class="py-2">
            <div class="h-9" />
          </div>
          <div class="h-px" />
          <div class="py-2">
            <div class="py-px">
              <div class="h-9" />
            </div>
          </div>
        </div>
      </div>

      <div class="absolute inset-x-px bottom-0">
        {/* Actions: These are just examples to demonstrate the concept, replace/wire these up however makes sense for your project. */}
        <div class="flex flex-nowrap justify-end space-x-2 px-2 py-2 sm:px-3">
          <Listbox as="div" value={assigned} onChange={setAssigned} class="flex-shrink-0">
            {({ open }) => (
              <>
                <Listbox.Label class="sr-only">Assign</Listbox.Label>
                <div class="relative">
                  <Listbox.Button class="relative inline-flex items-center whitespace-nowrap rounded-full bg-gray-50 px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 sm:px-3">
                    {assigned.value === null ? (
                      <UserCircleIcon class="h-5 w-5 flex-shrink-0 text-gray-300 sm:-ml-1" aria-hidden="true" />
                    ) : (
                      <img src={assigned.avatar} alt="" class="h-5 w-5 flex-shrink-0 rounded-full" />
                    )}

                    <span
                      class={classs(
                        assigned.value === null ? '' : 'text-gray-900',
                        'hidden truncate sm:ml-2 sm:block'
                      )}
                    >
                      {assigned.value === null ? 'Assign' : assigned.name}
                    </span>
                  </Listbox.Button>

                  <Transition
                    show={open}
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options class="absolute right-0 z-10 mt-1 max-h-56 w-52 overflow-auto rounded-lg bg-white py-3 text-base shadow ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                      {assignees.map((assignee) => (
                        <Listbox.Option
                          key={assignee.value}
                          class={({ active }) =>
                            classs(
                              active ? 'bg-gray-100' : 'bg-white',
                              'relative cursor-default select-none px-3 py-2'
                            )
                          }
                          value={assignee}
                        >
                          <div class="flex items-center">
                            {assignee.avatar ? (
                              <img src={assignee.avatar} alt="" class="h-5 w-5 flex-shrink-0 rounded-full" />
                            ) : (
                              <UserCircleIcon class="h-5 w-5 flex-shrink-0 text-gray-400" aria-hidden="true" />
                            )}

                            <span class="ml-3 block truncate font-medium">{assignee.name}</span>
                          </div>
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Transition>
                </div>
              </>
            )}
          </Listbox>

          <Listbox as="div" value={labelled} onChange={setLabelled} class="flex-shrink-0">
            {({ open }) => (
              <>
                <Listbox.Label class="sr-only">Add a label</Listbox.Label>
                <div class="relative">
                  <Listbox.Button class="relative inline-flex items-center whitespace-nowrap rounded-full bg-gray-50 px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 sm:px-3">
                    <TagIcon
                      class={classs(
                        labelled.value === null ? 'text-gray-300' : 'text-gray-500',
                        'h-5 w-5 flex-shrink-0 sm:-ml-1'
                      )}
                      aria-hidden="true"
                    />
                    <span
                      class={classs(
                        labelled.value === null ? '' : 'text-gray-900',
                        'hidden truncate sm:ml-2 sm:block'
                      )}
                    >
                      {labelled.value === null ? 'Label' : labelled.name}
                    </span>
                  </Listbox.Button>

                  <Transition
                    show={open}
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options class="absolute right-0 z-10 mt-1 max-h-56 w-52 overflow-auto rounded-lg bg-white py-3 text-base shadow ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                      {labels.map((label) => (
                        <Listbox.Option
                          key={label.value}
                          class={({ active }) =>
                            classs(
                              active ? 'bg-gray-100' : 'bg-white',
                              'relative cursor-default select-none px-3 py-2'
                            )
                          }
                          value={label}
                        >
                          <div class="flex items-center">
                            <span class="block truncate font-medium">{label.name}</span>
                          </div>
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Transition>
                </div>
              </>
            )}
          </Listbox>

          <Listbox as="div" value={dated} onChange={setDated} class="flex-shrink-0">
            {({ open }) => (
              <>
                <Listbox.Label class="sr-only">Add a due date</Listbox.Label>
                <div class="relative">
                  <Listbox.Button class="relative inline-flex items-center whitespace-nowrap rounded-full bg-gray-50 px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 sm:px-3">
                    <CalendarIcon
                      class={classs(
                        dated.value === null ? 'text-gray-300' : 'text-gray-500',
                        'h-5 w-5 flex-shrink-0 sm:-ml-1'
                      )}
                      aria-hidden="true"
                    />
                    <span
                      class={classs(
                        dated.value === null ? '' : 'text-gray-900',
                        'hidden truncate sm:ml-2 sm:block'
                      )}
                    >
                      {dated.value === null ? 'Due date' : dated.name}
                    </span>
                  </Listbox.Button>

                  <Transition
                    show={open}
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options class="absolute right-0 z-10 mt-1 max-h-56 w-52 overflow-auto rounded-lg bg-white py-3 text-base shadow ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                      {dueDates.map((dueDate) => (
                        <Listbox.Option
                          key={dueDate.value}
                          class={({ active }) =>
                            classs(
                              active ? 'bg-gray-100' : 'bg-white',
                              'relative cursor-default select-none px-3 py-2'
                            )
                          }
                          value={dueDate}
                        >
                          <div class="flex items-center">
                            <span class="block truncate font-medium">{dueDate.name}</span>
                          </div>
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Transition>
                </div>
              </>
            )}
          </Listbox>
        </div>
        <div class="flex items-center justify-between space-x-3 border-t border-gray-200 px-2 py-2 sm:px-3">
          <div class="flex">
            <button
              type="button"
              class="group -my-2 -ml-2 inline-flex items-center rounded-full px-3 py-2 text-left text-gray-400"
            >
              <PaperClipIcon class="-ml-1 mr-2 h-5 w-5 group-hover:text-gray-500" aria-hidden="true" />
              <span class="text-sm italic text-gray-500 group-hover:text-gray-600">Attach a file</span>
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
  )
}
