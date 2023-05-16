import { createSignal } from "solid-js"


export interface DragHandleProps {
    pos: [number, number]
    drag?: (x: [number, number]) => void
    dragend?: () => void
}

export function DragHandle(props: DragHandleProps) {
    const mousedown = (e: MouseEvent) => {
        e.preventDefault()
        const mousemove = (e: MouseEvent) => {
            e.preventDefault()
            props.drag?.([e.clientX, e.clientY])
        }
        const mouseup = (e: MouseEvent) => {
            e.preventDefault()
            props.dragend?.()
            window.removeEventListener('mousemove', mousemove)
            window.removeEventListener('mouseup', mouseup)
        }
        window.addEventListener('mousemove', mousemove)
        window.addEventListener('mouseup', mouseup)
    }
    return <div class='absolute  bg-blue-500 hover:bg-blue-700 rounded-lg'
        style={{ left: props.pos[0] + 'px', top: props.pos[1] + 'px', width: '10px', height: '10px' }}
        onMouseDown={mousedown}

    >

    </div>
}
interface Rect {
    left: number
    top: number
    width: number
    height: number
}

export function DragBox(props: { rect: Rect, pos: (x: number, y: number) => void }) {
    const ry = props.rect.top + props.rect.height / 2
    const [rx, setRx] = createSignal(props.rect.left + props.rect.width)
    const ly = props.rect.top + props.rect.height / 2
    const [lx, setLx] = createSignal(props.rect.left)

    const dragr = (x: [number, number]) => {
        setRx(x[0])
    }
    const dragl = (x: [number, number]) => {
        setLx(x[0])
    }
    const dragend = () => {

    }
    const sty = () => {

        const w = rx() - lx()
        const h = props.rect.height
        return {
            zIndex: 99,
            left: lx() + 'px',
            top: props.rect.left + 'px',
            width: w + 'px',
            height: h + 'px'
        }
    }
    return <div class='fixed opacity-30 bg-neutral-500 border-2 border-blue-500 rounded-lg' style={sty()}>
        <DragHandle pos={[lx(), ly]} drag={dragl} dragend={dragend} />
        <DragHandle pos={[rx(), ry]} drag={dragr} dragend={dragend} />
    </div>
}

export function TestDrag() {
    return <DragBox rect={{ left: 100, top: 100, width: 100, height: 100 }} pos={(x, y) => { }} />
}

