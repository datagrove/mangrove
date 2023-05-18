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

export default function RichTextEditor() {
  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div class="editor-container w-full h-full">
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
      </div>
    </LexicalComposer>
  );
}
//   <ToolbarPlugin />