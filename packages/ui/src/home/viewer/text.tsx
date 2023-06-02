/*
function SomeCellUser() {
    // mount a lexical editor and watch the cell

}



function SomeRangeUser() {
    // the normal input signal idea might be odd for scrolling
    // use mutate for that? if we create our own resource-like thing, how?
    const [a,scrollTo] = watchRange({path: "somepath", offset: 0, length: 10})
    let ed: Scroller
    onMount(()=>{
        // we need a call back that lets us know when the scroller wants to modify the range.
        ed = new Scroller(el,scrollTo)

    })
    createEffect(()=>{
        // don't call this again before you apply all the changes. Be careful to not call async in setA()
        ed.apply(a())

    })
}
*/

// export function watchCell(){
    
// }

// export function watchFile(path: string) : Accessor<number> {
//     const [state, setState] = createSignal(0)

//     return state
// }