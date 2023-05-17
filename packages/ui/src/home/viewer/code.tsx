import { createCodeMirror } from 'solid-codemirror';
import { createSignal, onMount } from 'solid-js';

export const CodeViewer = () => {
    const { editorView, ref: editorRef } = createCodeMirror({
        // The initial value of the editor
        value: "console.log('hello world!')",
        // Fired whenever the editor code value changes.
        onValueChange: (value: any) => console.log('value changed', value),
        // Fired whenever a change occurs to the document. There is a certain difference with `onChange`.
        onModelViewUpdate: (modelView: any) => console.log('modelView updated', modelView),
    });

    return <div ref={editorRef} />;
};

