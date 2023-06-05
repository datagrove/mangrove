import { Icon } from "solid-heroicons"
import { arrowsUpDown } from 'solid-heroicons/solid'
import { JSX } from 'solid-js'

export type  SplitterProps = {
    value: ()=>number
    setValue: (x: number)=>void
    class: string
} & JSX.HTMLAttributes<HTMLDivElement>
export const VSplitterButton = (props: SplitterProps) => {
    const mousedown = (e: MouseEvent) => {
      e.preventDefault()
      const start = e.clientY - props.value()
      const move = (e: MouseEvent) => {
        props.setValue(e.clientY - start)  // X if 
      }
      const up = (e: MouseEvent) => {
        window.removeEventListener("mousemove", move)
        window.removeEventListener("mouseup", up)
      }
      window.addEventListener("mousemove", move)
      window.addEventListener("mouseup", up)
    }
    return <div class={props.class} style={props.style} onMouseDown={mousedown}>
      </div>
  }

  export const HSplitterButton = (props: SplitterProps) => {
    const mousedown = (e: MouseEvent) => {
      e.preventDefault()
      const start = e.clientX - props.value()
      const move = (e: MouseEvent) => {
        props.setValue(e.clientX - start)  // X if 
      }
      const up = (e: MouseEvent) => {
        window.removeEventListener("mousemove", move)
        window.removeEventListener("mouseup", up)
      }
      window.addEventListener("mousemove", move)
      window.addEventListener("mouseup", up)
    }
    return <div class={props.class} style={props.style} onMouseDown={mousedown}>
      </div>
  }