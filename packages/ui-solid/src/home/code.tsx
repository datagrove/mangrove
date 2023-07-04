
import { createEffect, createResource, createSignal, onMount } from 'solid-js'
import { EditorState } from "@codemirror/state"
import { EditorView, keymap } from "@codemirror/view"
import { defaultKeymap } from "@codemirror/commands"
import { json } from "@codemirror/lang-json"
import { sql } from "@codemirror/lang-sql"
import {
    highlightSpecialChars, drawSelection, highlightActiveLine, dropCursor,
    rectangularSelection, crosshairCursor,
    lineNumbers, highlightActiveLineGutter
} from "@codemirror/view"
import { Extension } from "@codemirror/state"
import {
    defaultHighlightStyle, syntaxHighlighting, indentOnInput, bracketMatching,
    foldGutter, foldKeymap
} from "@codemirror/language"
import { history, historyKeymap } from "@codemirror/commands"
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search"
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete"
import { lintKeymap } from "@codemirror/lint"
import './code.css'
import { VSplitterButton } from './splitter'
import { usePage } from '../core'
import { BlueButton } from '../lib/form'
import { Column, EstimatorFn, BuilderFn, TableContext, ScrollerProps, Scroller } from '../editor'





// this should a scroller concept to operate on very large files
// use database ideas we should be able insert lines into terabyte files!
// export const CodeViewer = () => {
//     const { editorView, ref: editorRef } = createCodeMirror({
//         // The initial value of the editor
//         value: "console.log('hello world!')",
//         // Fired whenever the editor code value changes.
//         onValueChange: (value: any) => console.log('value changed', value),
//         // Fired whenever a change occurs to the document. There is a certain difference with `onChange`.
//         onModelViewUpdate: (modelView: any) => console.log('modelView updated', modelView),
//     });

//     return <div ref={editorRef} />;
// };

// it would be nice to support downloading sqlite files in addition to accessing ours; 

// horizontal split is customary, but doesn't lend it self to mobile
// ai would be ideal, is there a way to support though?
// cursor-col-resize

// i need a better system of creating messagechannels to the database worker


// seems like signals don't need this because render functions execute synchronously?
// export function IncrSignal<Type,Diff>(t: Type) {
//     const diffs : Diff[] = []
//     const [get,set]= createSignal<[Type,Diff[]]>([t,[]])
//     const trim = (i: number) {
//         set(diffs)
//     }
//     return [ get, ]
// }

// how do we mount a lexical editor in a div inside a scroller row?
// how does it function?


export function CodeEditor() {
    // from the url I need to figure out the query parameters, but I can't execute a query here 
    const p = usePage()

    return <div>
      

        </div>

}

export function DatabaseViewer() {
    const [split, setSplit] = createSignal(300)
    let el: HTMLDivElement
    let cm: CodeMirror
    createEffect(() => {
        cm = useCodeMirror(el, "select * from file")
    })
    const run = () => {
        let src = cm.ev?.state.doc.toString()
        if (!src) return
        // const a = db?.query(src)
        // console.log(src,  a )
    }

    return <>
        <div class='absolute right-2' style={{
            "z-index": 11000,
            top: split() - 36 + 'px'
        }}><BlueButton onClick={run}>Run</BlueButton></div>

        <div
            class='absolute dark:bg-gradient-to-r dark:from-black dark:to-neutral-900 overflow-hidden w-full left-0 top-0 '
            style={{
                height: split() + 'px'
            }}
        >
            <CodeViewer />
        </div>
        <VSplitterButton style={{
            "z-index": 10000,
            top: split() + "px"
        }} class='w-full h-1.5 absolute hover:bg-blue-500 hover:opacity-100 bg-blue-700 opacity-0 cursor-ns-resize' value={split} setValue={setSplit} />
        <div class='w-full absolute bottom-0 '
            style={{
                top: split() + 'px'
            }}>
            <TableViewer />
        </div>
    </>
}


// tables need a header
// all pages need an info box.
// we probably need terminal to work
export function TableViewer() {
    let el: HTMLDivElement
    let tombstone: HTMLDivElement

    const N = 100
    const c: Column[] = []
    for (let i = 0; i < N; i++) {
        c.push({ tag: i, width: 96, html: "col" + i })
    }

    onMount(() => {
        let tombstoneHeight_ = tombstone.offsetHeight
        tombstone.style.display = 'none'

        const est: EstimatorFn = (start: number, end: number) => {
            const r = (end - start) * 24
            //console.log("est", start, end, tombstoneHeight_, r)
            return r
        }

        const bld: BuilderFn = (ctx: TableContext) => {
            const f = <p class='p-4'>{ctx.row},{ctx.column.tag}</p>
            ctx.render(f)
        }

        const props: ScrollerProps = {
            container: el!,
            row: {
                count: N
            },
            column: {
                header: c,
            },
            builder: bld,
            height: est,
        }
        const s = new Scroller(props)
    })


    return <>
        <div class={'h-full w-full absolute '} ref={el!}></div>
        <p ref={tombstone!}>&nbsp;</p>
    </>

}


export function DatabaseTool() {
    return <div>Database tool</div>
}


export const basicSetup: Extension = (() => [
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightSpecialChars(),
    history(),
    foldGutter(),
    drawSelection(),
    dropCursor(),
    EditorState.allowMultipleSelections.of(true),
    indentOnInput(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    bracketMatching(),
    closeBrackets(),
    autocompletion(),
    rectangularSelection(),
    crosshairCursor(),
    highlightActiveLine(),
    highlightSelectionMatches(),
    json(),
    sql(),
    keymap.of([
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...searchKeymap,
        ...historyKeymap,
        ...foldKeymap,
        ...completionKeymap,
        ...lintKeymap
    ])
])()

export class CodeMirror {
    ev?: EditorView
    constructor(public div: HTMLDivElement, value: string) {
        let startState = EditorState.create({
            doc: value,
            extensions: [
                basicSetup,
            ]
        })

        onMount(() => {
            this.ev = new EditorView({
                state: startState,
                parent: div
            })
        })
    }
    get text(): string {
        return this.ev?.state.doc.toString() ?? ""
    }
}
export function useCodeMirror(div: HTMLDivElement, value: string): CodeMirror {
    return new CodeMirror(div, value)
}

export function CodeViewer() {
    let el: HTMLDivElement
    createEffect(() => {
        useCodeMirror(el, "select * from file")
    })
    return <div class='h-full w-full' ref={el!} />
}