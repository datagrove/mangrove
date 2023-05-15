
import { faker } from '@faker-js/faker'
import { Scroller } from './scroll'
import { createEffect } from 'solid-js'

import { createSignal, JSXElement, onMount } from 'solid-js'
import { render } from 'solid-js/web'
import { Icon } from 'solid-heroicons'
import { xMark, check } from 'solid-heroicons/solid'

import { Editor } from './editor'
import { html2md, md2html } from './md'
import { ln, setLn } from './i18n'


// global css class?
const redFrame =   "border-solid border-2 border-red-500"
const greenFrame = "border-solid border-2 border-green-500"

export interface Chat {
    message: string
    avatar: string
}
let count = 0
function randomChat(): Chat {
    return {
        message: count++ + ". " + faker.lorem.paragraph(),
        avatar: faker.image.avatar()
    }
}
export const chats = [...new Array(100)].map(e => randomChat())
// we should try to limit the number of creates

export function FakeScroll() {
    let el: HTMLDivElement
    // we can try to recreate the editor as raw typescript to make it easier to wrap in various frameworks. 
    const ed = new Editor
    let edel: HTMLDivElement

    onMount(() => {
      ed.mount(edel)
      ed.text = "בְּרֵאשִׁ֖ית בָּרָ֣א אֱלֹהִ֑ים אֵ֥ת הַשָּׁמַ֖יִם וְאֵ֥ת הָאָֽרֶץ׃"
    })

    createEffect(() => {
      const s = new Scroller<Chat>(el!, {
        items: chats,
        // builder takes a T and creates dom from it.
        builder(chat: Chat | null, old: HTMLElement) {
          old.innerHTML = chat ? `<p>${chat.message}<p>` : '<p>tombstone</p>'
        },
      })
    })
  
    return <><div class='right-0 bottom-32 left-80 absolute overflow-y-auto overflow-x-hidden h-screen' ref={el!}>
  
    </div>
      <div class='right-0 bottom-0 left-80 absolute overflow-y-auto overflow-x-hidden h-32  ' >
        <div class='h-full w-full max-w-none prose dark:prose-invert' ref={edel!} />
      </div>
    </>
  
  }
  


/*
// to generate
export class Query2 {

}

async function query2(dx: Dx,props: {} ) : Promise<Snapshot<Query2>> {
    let count = 0
    let fn = (n: number) => new Query2
    return new Snapshot<Query2>(count, fn)
}

// needs to be wrapped in a useEffect
type Query2Scroller = ScrollerView<Query2>
function test(props: {
    dom: HTMLElement 
    changeSelection?: (x: Query2Scroller )=>void
    changeScroll?: (x:Query2Scroller)=>void
}) {
    const dx = useDx()
    // create a snapshot
    const q = query2(dx)

    // create a scroller from the snapshot
    const s = new ScrollerView<Query2>(dom,builder,tombstone)
    // listen to the snapshot.
    
}


*/
