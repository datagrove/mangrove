import { createEffect } from 'solid-js'
import tippy from 'tippy.js'
import 'tippy.js/dist/tippy.css'



export function TippyButton() {
    let el:HTMLButtonElement
    createEffect(() => {
        tippy(el as any, {
            content: 'My tooltip'
        })
    })
    
    return <button ref={el!} >My tippy button</button>
}