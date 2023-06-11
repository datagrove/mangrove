import { $getNodeByKey, $getRoot, $getSelection, EditorState, LexicalEditor, LexicalNode } from "lexical";
import { LinkNode } from "@lexical/link";
import { AutoLinkNode } from "@lexical/link";
import "./RichTextEditor.css";
import { LinkPlugin } from "./lexical-solid/LexicalLinkPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { OnChangePlugin } from "./lexical-solid/LexicalOnChangePlugin";
import { AutoFocusPlugin } from "./lexical-solid/LexicalAutoFocusPlugin";
import { LexicalComposer } from "./lexical-solid/LexicalComposer";
import { RichTextPlugin } from "./lexical-solid/LexicalRichTextPlugin";
import { ContentEditable } from "./lexical-solid/LexicalContentEditable";
import { HistoryPlugin } from "./lexical-solid/LexicalHistoryPlugin";
import TreeViewPlugin from "./TreeViewPlugin";
import CodeHighlightPlugin from "./CodeHighlightPlugin";
// import ToolbarPlugin from "~/plugins/ToolbarPlugin";
import RichTextTheme from "./RichTextTheme";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { LexicalErrorBoundary } from "./lexical-solid/LexicalErrorBoundary";
import { TextMenu } from "./menu";
import { Icon } from "solid-heroicons";
import { sparkles, ellipsisHorizontal as menu, check, arrowUturnLeft as undo, arrowUturnRight as redo, plus, } from "solid-heroicons/solid";
//import { EmojiNode } from "./nodes/EmojiNode";
//import EmoticonPlugin from "./plugins/EmoticonPlugin";

import { createContext, createEffect, createResource, onMount, useContext } from "solid-js";


import { pencil } from "solid-heroicons/solid";
import { useNavigate } from "@solidjs/router";
import { SiteDocument, readAll, useDocument, usePage } from "../core";

import { UNDO_COMMAND, REDO_COMMAND } from 'lexical';
import { useLexicalComposerContext } from './lexical-solid/LexicalComposerContext';
import { debounce } from "../core/rpc";
import {  JsonPatch, Sync, VOID, sync } from "./sync";
import { Listener } from "lexical/LexicalEditor";

type PatchListener = (p:JsonPatch[])=>void

export interface LexicalProvider {
  open(path: string,onChange: PatchListener): Promise<[string,PatchListener]>
  close(l: PatchListener): void
}



// When the editor changes, you can get notified via the
// LexicalOnChangePlugin!
function onChange(
  editorState: EditorState,
  tags: Set<string>,
  editor: LexicalEditor
) {
  editorState.read(() => {
    // Read the contents of the EditorState here.
    const root = $getRoot();
    const selection = $getSelection();

    //console.log(root, selection);
  });
}

const editorConfig = {
  // The editor theme
  theme: RichTextTheme,
  namespace: "",
  // Handling of errors during update
  onError(error: any) {
    throw error;
  },
  // Any custom nodes go here
  nodes: [
    HeadingNode,
    ListNode,
    ListItemNode,
    QuoteNode,
    CodeNode,
    CodeHighlightNode,
    TableNode,
    TableCellNode,
    TableRowNode,
    AutoLinkNode,
    LinkNode,
  ] as any,
};


export const LexicalContext = createContext<LexicalProvider>()
export function  useLexical () { return useContext(LexicalContext) }


function Bottom() {
  return <div class='w-full h-8 dark:bg-neutral-900 bg-neutral-100 border-b border-neutral-200 flex items-center '>
    <Icon class='h-6 w-6' path={check} />
    <div class='flex-1 '></div>
    <div class='space-x-4 flex mr-2'>
      <Icon class='h-6 w-6' path={undo} />
      <Icon class='h-6 w-6' path={redo} />
      <Icon class='h-6 w-6' path={plus} />
      <Icon class='h-6 w-6' path={sparkles} />
      <Icon class='h-6 w-6' path={menu} /></div>
  </div>
}
export interface RteProps {
  path?: string
  placeholder?: string
}
export function RichTextEditor(props: RteProps) {
  const prov = useLexical()!

  const Menu = () => {
    const [editor] = useLexicalComposerContext();
    return <div class='w-full h-8 dark:bg-neutral-900 bg-neutral-100 border-b border-neutral-200 flex items-center '>
      <Icon class='h-6 w-6' path={check} />
      <div class='flex-1 '></div>
      <div class='space-x-4 flex mr-2'>
        <Icon class='h-6 w-6' path={undo} onClick={() => editor.dispatchCommand(UNDO_COMMAND,VOID)} />
        <Icon class='h-6 w-6' path={redo} onClick={() => editor.dispatchCommand(REDO_COMMAND,VOID)} />
        <Icon class='h-6 w-6' path={plus} />
        <Icon class='h-6 w-6' path={sparkles} />
        <Icon class='h-6 w-6' path={menu} /></div>
    </div>
  }
  


  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div class="editor-container w-full h-full">
        <Menu />
        <TextMenu />

        <div class="editor-inner w-full h-full">

          <RichTextPlugin
            contentEditable={<ContentEditable class="editor-input" ></ContentEditable>}
            placeholder={<div class='absolute hidden top-4 left-4 text-neutral-500'>{props.placeholder}</div>}
            errorBoundary={LexicalErrorBoundary}
          />
          <LinkPlugin />
          <AutoFocusPlugin />
          <OnChangePlugin onChange={onChange} />
          <HistoryPlugin />
          <AutoFocusPlugin />
          <CodeHighlightPlugin />
          <Sync path={props.path}/>
        </div>
       
      </div>
    </LexicalComposer>
  );
}
//   <ToolbarPlugin />




type LocalStoragePluginProps = {
  namespace: string;
};

export function LocalStoragePlugin({ namespace }: LocalStoragePluginProps) {
  const [editor] = useLexicalComposerContext();

  const saveContent =
    (content: string) => {
      localStorage.setItem(namespace, content);
    }
  const debouncedSaveContent = debounce(saveContent, 500);

  createEffect(() => {
    return editor.registerUpdateListener(
      ({ editorState, dirtyElements, dirtyLeaves }) => {
        // Don't update if nothing changed
        if (dirtyElements.size === 0 && dirtyLeaves.size === 0) return;

        const serializedState = JSON.stringify(editorState);
        debouncedSaveContent(serializedState);
      }
    );
  }, [debouncedSaveContent, editor]);

  return null;
}

// we can use hash to see if we should show readonly or editable
// and potentially use multiple available editors "open with"
export function TextEditor() {

  return <RichTextEditor />
}

// note that as html / markdown we'll have to resolve links relative to the doc
export function TextViewer() {
  const nav = useNavigate()
  const doc = usePage()
  const [h] = createResource(doc.path, readAll)

  const onedit = () => {
    nav('#edit')
  }
  // we may still have to wait here; we might get the type of the document but now need to read the rest of the document
  // or some large piece of it.
  return <div><div innerHTML={h()} />
    <button onClick={onedit} class='z-60 fixed p-2 bottom-2 right-2 rounded-full text-blue-700 hover:text-blue-500'><Icon class='h-6 w-6' path={pencil} /></button>

  </div>
}
