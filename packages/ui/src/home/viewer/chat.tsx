// one cell width
// potentially multiple columns if the screen is wide enough
// if clicking a thread in column x, default to opening in column x+1?
// probably use vscode way of explicit splittings

import { createResource, createSignal, onMount } from "solid-js"
import { Column, Scroller, ScrollerProps, TableContext } from "../../editor/scroll"
import { readAll, usePage } from "../../core"
import { useNavigate } from "@solidjs/router"
import CodeHighlightPlugin from "../../lexical/CodeHighlightPlugin"
import { LexicalComposer, RichTextPlugin, ContentEditable, LexicalErrorBoundary, LinkPlugin, AutoFocusPlugin, OnChangePlugin, HistoryPlugin, useLexicalComposerContext } from "../../lexical/lexical-solid"
import { CodeNode, CodeHighlightNode } from "@lexical/code"
import { AutoLinkNode, LinkNode } from "@lexical/link"
import { ListNode, ListItemNode } from "@lexical/list"
import { HeadingNode, QuoteNode } from "@lexical/rich-text"
import { TableNode, TableCellNode, TableRowNode } from "@lexical/table"
import RichTextTheme from "../../lexical/RichTextTheme"
import { EditorState, LexicalEditor, $getRoot, $getSelection, KEY_ENTER_COMMAND } from "lexical"
import {$getHtmlContent} from '@lexical/clipboard'
import { TextMenu } from "../../lexical/menu"
import { handThumbUp as reactionIcon , arrowUturnLeft as  replyIcon, hashtag as threadIcon, ellipsisHorizontal as dotsIcon} from 'solid-heroicons/solid'
import { IconPath } from "../search"
import { Icon } from "solid-heroicons"
import { SectionNav } from "../site_menu"
import { Message, chatTable } from "../../db/editor_schema"
import { ScanDiff } from "../../core/data"
import { useDg } from "../../db"

//import { getUsage } from "../../db/range"
// multiple messages close to each should be grouped
// date changes need a divider
// images are generall sent with a message.
// what about grouping these in the query?

// chat panels are mostly ordered, like a spreadsheet (but no blank rows, 1 column)
// chat viewers are sorted by date, like a table

// this should basically be edited as lexical document?
// it could be displayed with threads dynamically added (and removed)
// maybe "more" to solve disappearing threads? This could show the threads as a table.
// maybe it should be compiled back and forth for optimization?

const show = [
    {
        "name": "Messages",
        "path": "/en/jim.hurd",
        "children": [

            {
                "name": "Personal",
                "path": "/en/jim.hurd",
                "children": [
                    {
                        "name": "Theme",
                        "path": "/en/jim.hurd"
                    }
                ]
            },

            {
                "name": "Group",
                "path": "/en/jim.hurd",
                "children": [
                    {
                        "name": "Login",
                        "path": "/en/jim.hurd"
                    },
                    {
                        "name": "Recover",
                        "path": "/en/jim.hurd"
                    },
                    {
                        "name": "Register",
                        "path": "/en/jim.hurd"
                    }
                ]
            }
        ]
    }
]

export function ChatPanel() {
    return <div class='w-full pb-16 pt-2 px-2'>
        <SectionNav tabs={show} />
    </div>
}

// any message (message group?) can change at any time.
// [chats, refresh] = createResource(path, getChats)
// asking for a chat we don't have will trigger a refresh
// what is a our data model for chat?
// create table(gtime, message)
// I want to subscribe to a range , the signal could give me just a version
// or could it stream differences? or either?
// we might have a last read from state in our user state

// chat's can be deleted, but cannot be inserted.
// should we take advantage of this though? scroller should suport insertions?
// insertions can only be based on position, not really on key?
// afterKey becomes hard if the key gets deleted? 
// deletions mess up the count.
// not all virtual scrollers necessarily have a count.
// only create the scroller once, even if the data changes

/*
export class RangeView<T> {
    data: T[] = []

    apply(updates: TableUpdate[]) {

    }
}
*/

// what trick should we do to url to a database connection on a another server?
// maybe ?server=xxx


export function ChatViewer() {
    let el: HTMLDivElement | null = null
    let el2: HTMLDivElement | null = null   

    const db = useDg()

    let ed: Scroller

    const sp = usePage()

    // const q : ScanQuery = {
    //     server: sp.server,
    //     site: sp.path,
    //     table: "chat",
    //     from: sp.path,
    //     limit: 1000
    // }

    //const tr = new RangeView<Message>()
    
    // maybe instead of a builder we should 
    onMount(async () => {
        const inode = 1; // await to get the index from the path.
        const lastRead = 0


        const cm = new Map<number, Column>()
        // we don't really know how many rows we will have when we mount.
        let opts: ScrollerProps = {
            container: el!,
            // we could cache and revoke the context.
            // we could 
            // builder could be async? cause a refresh?
            builder: function (ctx: TableContext): void {
                const o = ctx.old.value as Message
                ctx.render(<MessageWithUser message={o} />)
            }
        }
        ed = new Scroller(opts)
        const diff = (x: ScanDiff) => {
            ed.applyDiff(x)
        }
        const q = createQuery(db, chatTable, { from: {id: 1, created: lastRead} } ,diff)
        // ed.addListener((pos: number) => {
        //     q.update(pos)
        // })
    })



    // anything can change, we need to let the scroller know
    // some changes can be deletions and insertions.
    // some could be character by character, probably probably not here.

  
    const send = (html: any) => {
        console.log(html)
    }
    return <div>
        <div class='absolute top-0 left-0 right-0 bottom-64 overflow-auto' ref={el!} style={{
            bottom: editHeight() + 'px'
        }} />
        <div class='absolute h-64  left-0 right-0 bottom-0 overflow-auto' ref={el2!} 
            style={{
                height: editHeight() + 'px'
            }}>
            <ChatEditor onSend={send}/>
        </div>
    </div>
}

//   type ImageProps = { src, sizes, unoptimized, priority, loading, lazyBoundary, class, quality, width, height, objectFit, objectPosition, onLoadingComplete, loader, placeholder, blurDataURL, ...all }:
function Image(props: any) {
    return <img {...props} />
}

function Reactions(props: { message: Message }) {
    return (
        <div class="flex items-center">
            {props.message.reactions.map(r => <span class="mr-1">{r.emoji}</span>)}
        </div>
    )
}

function MenuIcon(props: { path: IconPath, onClick: () => void }) {
    return <div class='hover:bg-neutral-800'><button onClick={props.onClick}><Icon class='h-5 w-5' path={props.path} /></button></div>
}

function MessageMenu(props: { message: Message }) {
    const reply = () => {}
    const dots = () => {}
    const reaction = () => {}
    const thread = () => {}
    return (
        <div class="ml-auto flex">
            <MenuIcon path={reactionIcon} onClick={reaction} />
            <MenuIcon path={replyIcon} onClick={reply}/>
            <MenuIcon path={threadIcon} onClick={thread}/>
            <MenuIcon path={dotsIcon} onClick={dots}/>
        </div>
    )
}
function MessageWithUser(props: { message: Message }) {
    return (
        <div class="flex py-0.5 pl-4 mt-[17px] leading-[22px] hover:bg-neutral-900 group">
            <img class="mr-3 inline-block h-14 w-14 rounded-full" src={props.message.author.avatarUrl} alt=""/>
            <div>
                <div class="flex items-baseline">
                    <div class="flex-grow">
                    <span class="mr-2 font-medium text-green-400">
                        {props.message.author.display}
                    </span>
                    <span class="text-xs font-medium text-gray-400">
                        {props.message.date}
                    </span>
                    </div>
                    <div class='opacity-0 group-hover:opacity-100'><MessageMenu message={props.message}/></div>
                </div>
                <p class="text-gray-100 pr-16 ">{props.message.text}</p>
                <Reactions message={props.message} />
            </div>
        </div>
    )
}

export type MessageProps = {
    message: {
        text: string
    }
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

  const [editHeight, setEditHeight] = createSignal(48)
  
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
        const r = editor.getRootElement()
        let h = (r?.firstChild as any).scrollHeight + 16
        if (h > 48) {
            if (h > 200) { h = 200 }
            setEditHeight(h)
        }
      //console.log(root, selection);
    });
  }
// this needs to open on any message, not just the bottom
interface ChatEditorProps {
    onSend: (html: any) => void
}
export function ChatEditor(props: ChatEditorProps) {
    const nav = useNavigate()
    const doc = usePage()
    const [h] = createResource(doc.path, readAll)

    const onedit = () => {
      nav('')
    }
  
   /* */

      const Foo = () => {
        const [editor] = useLexicalComposerContext();
        editor.registerCommand(
            KEY_ENTER_COMMAND,
            (event:KeyboardEvent) => {
              if (event.shiftKey) {
                // process ok?
              } else {
                props.onSend($getHtmlContent(editor))
                editor.update(() => {
                    const root = $getRoot();
                    //const paragraph = $createParagraphNode();
                    root.clear();
                    // root.append(paragraph);
                    // paragraph.select();
                  });
              }
              return true
            },
            2
          )
        return <></>
      }
    return (
      <LexicalComposer initialConfig={editorConfig}>
        <div class="editor-container w-full h-full">
        <TextMenu />
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
            <Foo/>
            <AutoFocusPlugin />
            <CodeHighlightPlugin />
          </div>
        </div>
      </LexicalComposer>
    );
  }