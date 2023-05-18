import { createEffect } from 'solid-js'
import { BuilderFn, Column, enableColumnResizing, EstimatorFn, Scroller, ScrollerProps, TableContext } from '../../editor/scroll'
// wrappers for shared scroll code
// interface ListScrollerProps {
//     rows: number
//     builder: (row: number, d: HTMLDivElement) => void
// }

// export function ListScroller(props: ListScrollerProps) {
//     let el: HTMLDivElement | null = null
//     const pr: ScrollerProps = {
//         ...props,
//         container: el!,
//     }
//     createEffect(() => {
//         const scroller = new Scroller(pr)
//     })
//     return <div ref={el!} />
// }

// chat and text are one column scrollers

// sheet and folder are multicolumn scrollers. Text can embed multicolumn scrollers



// code doesn't use table at all
// 