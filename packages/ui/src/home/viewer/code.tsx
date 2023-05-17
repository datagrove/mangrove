
import { createEffect, onMount } from 'solid-js'
import { EditorState } from "@codemirror/state"
import { EditorView, keymap } from "@codemirror/view"
import { defaultKeymap } from "@codemirror/commands"
import { json } from "@codemirror/lang-json"
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
        useCodeMirror(el, "console.log('hello world!')")
    })
    return <div class='h-full w-full' ref={el!} />
}