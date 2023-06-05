
import { createEffect, createSignal, onMount } from 'solid-js'
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
import { left } from '../../core'
import { SheetViewer } from './sheet'
import { TableViewer } from './table'

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


export function DatabaseViewer() {
    const [split,setSplit] = createSignal(300)
    return <>
            <div
              class='absolute dark:bg-gradient-to-r dark:from-black dark:to-neutral-900 overflow-hidden w-full left-0 top-0 '
              style={{
                height: split()+'px'
              }}
            >
        <CodeViewer />
        </div>
        <VSplitterButton style={{
            "z-index": 10000,
            top: split()+"px"
        }} class='w-full h-1.5 absolute hover:bg-blue-500 hover:opacity-100 bg-blue-700 opacity-0 cursor-ns-resize' value={split} setValue={setSplit}/>
        <div class='w-full absolute bottom-0 ' 
            style={{
                top: split()+'px'
            }}>
            <TableViewer/>
        </div>
        </>
}

export function DatabaseViewer2() {
    const [split,setSplit] = createSignal(300)
    return <>
        <div
              class='absolute dark:bg-gradient-to-r dark:from-black dark:to-neutral-900 overflow-hidden w-full left-0 top-0 '
              style={{
                height: split()+'px'
              }}
            >
        <CodeViewer />
        </div>
        <VSplitterButton style={{
            top: split()+"px"
        }} class='w-full h-4 absolute hover:bg-blue-700 hover:opacity-100 opacity-100 cursor-ns-resize' value={split} setValue={setSplit}/>

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