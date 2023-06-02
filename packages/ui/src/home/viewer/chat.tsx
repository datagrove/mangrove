// one cell width
// potentially multiple columns if the screen is wide enough
// if clicking a thread in column x, default to opening in column x+1?
// probably use vscode way of explicit splittings

import { createEffect, createResource } from "solid-js"
import { Column, Scroller, ScrollerProps, TableContext } from "../../editor/scroll"
import { faker } from "@faker-js/faker"
import { getDocument, readAll, usePage } from "../../core"
import { RteProps } from "../../lexical"
import { useNavigate } from "@solidjs/router"
import CodeHighlightPlugin from "../../lexical/CodeHighlightPlugin"
import { LexicalComposer, RichTextPlugin, ContentEditable, LexicalErrorBoundary, LinkPlugin, AutoFocusPlugin, OnChangePlugin, HistoryPlugin } from "../../lexical/lexical-solid"
import { CodeNode, CodeHighlightNode } from "@lexical/code"
import { AutoLinkNode, LinkNode } from "@lexical/link"
import { ListNode, ListItemNode } from "@lexical/list"
import { HeadingNode, QuoteNode } from "@lexical/rich-text"
import { TableNode, TableCellNode, TableRowNode } from "@lexical/table"
import RichTextTheme from "../../lexical/RichTextTheme"
import { EditorState, LexicalEditor, $getRoot, $getSelection } from "lexical"

export interface Message {
    text: string
    avatarUrl: string
    user: string
    date: string
}

function fake() : Message[] {
    const chats: Message[] = []
    for (let i = 0; i < 100; i++) {
        chats.push({
            text: faker.lorem.paragraph(),
            avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
            user: faker.person.fullName(),
            date: faker.date.recent().toLocaleDateString(),
        })     
    }
    return chats
}

export function ChatViewer() {
    const sp = usePage()
    const doc = createResource(sp.path, getDocument)
    // we might have a last read from state in our user state
    const chats = fake()
    
    let el: HTMLDivElement | null = null
    let el2: HTMLDivElement | null = null   
    createEffect(() => {
        const cm = new Map<number, Column>()
        let opts: ScrollerProps = {
            container: el!,
            row: {
                count: chats.length,
            },
            builder: function (ctx: TableContext): void {
                const o: Message = chats[ctx.row]
                ctx.render(<MessageWithUser message={o} />)
            }
        }
        let ed = new Scroller(opts)
    })
    return <div>
        <div class='absolute top-0 left-0 right-0 bottom-64 overflow-auto' ref={el!} />
        <div class='absolute h-64 border border-red-100 left-0 right-0 bottom-0 overflow-auto' ref={el2!} >
            <ChatEditor/>
        </div>
    </div>
}



//   type ImageProps = { src, sizes, unoptimized, priority, loading, lazyBoundary, class, quality, width, height, objectFit, objectPosition, onLoadingComplete, loader, placeholder, blurDataURL, ...all }:
function Image(props: any) {
    return <img {...props} />
}

function MessageWithUser(props: { message: Message }) {
    return (
        <div class="flex py-0.5 pr-16 pl-4 mt-[17px] leading-[22px] hover:bg-gray-950/[.07]">
            <img class="mr-3 inline-block h-14 w-14 rounded-full" src={props.message.avatarUrl} alt=""/>
            <div>
                <p class="flex items-baseline">
                    <span class="mr-2 font-medium text-green-400">
                        {props.message.user}
                    </span>
                    <span class="text-xs font-medium text-gray-400">
                        {props.message.date}
                    </span>
                </p>
                <p class="text-gray-100">{props.message.text}</p>
            </div>
        </div>
    )
}

export type MessageProps = {
    message: {
        text: string
    }
}

function Message({ message }: MessageProps) {
    return (
        <div class="py-0.5 pr-16 pl-4 leading-[22px] hover:bg-gray-950/[.07]">
            <p class="pl-14 text-gray-100">{message.text}</p>
        </div>
    )
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
// this needs to open on any message, not just the bottom
export function ChatEditor(props: RteProps) {
    const nav = useNavigate()
    const doc = usePage()
    const [h] = createResource(doc.path, readAll)

    const onedit = () => {
      nav('')
    }
  
    return (
      <LexicalComposer initialConfig={editorConfig}>
        <div class="editor-container w-full h-full">
  
          <div class="editor-inner w-full h-full">
  
            <RichTextPlugin
  
              contentEditable={<ContentEditable class="editor-input" ></ContentEditable>}
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