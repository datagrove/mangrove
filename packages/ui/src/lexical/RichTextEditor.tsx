import { $getRoot, $getSelection, EditorState, LexicalEditor } from "lexical";
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
import { sparkles, ellipsisHorizontal as menu, check, arrowUturnLeft as undo, arrowUturnRight as redo, plus,  } from "solid-heroicons/solid";
//import { EmojiNode } from "./nodes/EmojiNode";
//import EmoticonPlugin from "./plugins/EmoticonPlugin";



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

function Toolbar() {
  return <div class='w-full h-8 dark: bg-neutral-900 bg-neutral-100 border-b border-neutral-200 flex items-center '>
    <Icon class='h-6 w-6' path={check}/>
    <div class='flex-1 '></div>
    <div class='space-x-4 flex mr-2'>
    <Icon class='h-6 w-6' path={undo}/>
    <Icon class='h-6 w-6' path={redo}/>
    <Icon class='h-6 w-6' path={plus}/>
    <Icon class='h-6 w-6' path={sparkles}/>
    <Icon class='h-6 w-6' path={menu}/></div>
    </div>
}
function Bottom() {
  return <div class='w-full h-8 dark: bg-neutral-900 bg-neutral-100 border-b border-neutral-200 flex items-center '>
    <Icon class='h-6 w-6' path={check}/>
    <div class='flex-1 '></div>
    <div class='space-x-4 flex mr-2'>
    <Icon class='h-6 w-6' path={undo}/>
    <Icon class='h-6 w-6' path={redo}/>
    <Icon class='h-6 w-6' path={plus}/>
    <Icon class='h-6 w-6' path={sparkles}/>
    <Icon class='h-6 w-6' path={menu}/></div>
    </div>
}

export default function RichTextEditor() {
  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div class="editor-container w-full h-full">
        <Toolbar/>
        <TextMenu />

        <div class="editor-inner w-full h-full">

          <RichTextPlugin
            contentEditable={<ContentEditable class="editor-input" />}
            placeholder={<div class='absolute hidden top-4 left-4 text-neutral-500'>Enter some plain text...</div>}
            errorBoundary={LexicalErrorBoundary}
          />
          <LinkPlugin />
          <AutoFocusPlugin />
          <OnChangePlugin onChange={onChange} />
          <HistoryPlugin />

          <AutoFocusPlugin />
          <CodeHighlightPlugin />
        </div>
        <Bottom/>
      </div>
    </LexicalComposer>
  );
}
//   <ToolbarPlugin />