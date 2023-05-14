
import { faker } from '@faker-js/faker'
import { Scroller } from './scroll'
import { createEffect } from 'solid-js'

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
