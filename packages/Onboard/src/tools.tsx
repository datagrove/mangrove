import { createSignal } from "solid-js";
import { Tool, Viewer } from "../../ui-solid/src";
import { FloatIcon, Settings, SettingsViewer } from "../../composer-solid/src";
//import { ChatPanel, ChatViewer, DatabaseTool, DatabaseViewer } from "./viewer";
import { squaresPlus as addTools, signalSlash, bars_3 as menu, user as avatar, clock as history, pencil, chatBubbleBottomCenter as friend, magnifyingGlass, map, plusCircle, circleStack } from "solid-heroicons/solid";
import { ChatPanel, ChatViewer } from "../../chat-solid/src";
import { CodeViewer, DatabaseTool, DatabaseViewer } from "../../code-solid/src";
import { MapTool, MapViewer } from "../../map-solid/src";
import { EditTool, EditViewer, TextEditor, TextViewer } from "../../lexical-solid/src";
import { SheetViewer } from "../../sheet-solid/src";
import { SearchPanel, SearchViewer } from "../../composer-solid/src";

// the tools are a mix of defaults, site specific, and user specific.
// overall the user should be in control though.
// viewers are selected by the document type, can be overridden by the hash
export type ViewerMap = {
  [key: string]: Viewer
}
const builtinViewers: ViewerMap = {
  // "folder": { default: () => <FolderViewer /> },
  "text": { default: () => <TextViewer /> },
  "text-edit": { default: () => <TextEditor /> },
  "chat": { default: () => <ChatViewer /> },
  "settings": { default: () => <SettingsViewer /> },
  "sheet": { default: () => <SheetViewer /> },
  "code": { default: () => <CodeViewer /> },
  "form": { default: () => <div>Form</div> } // can also be perspective of text?
}
export const [viewers, setViewers] = createSignal(builtinViewers)
const builtinTools: { [key: string]: Tool } = {
    "edit": {
      icon: () => <FloatIcon path={pencil} />,
      component: EditTool,
      path: 'a/b/text',
      viewer: EditViewer
    },
    // message home
    // Message component is also used for the alerts - how?
    "dm": {
      icon: () => <FloatIcon path={friend} />,
      component: () => <ChatPanel />,
      path: 'a/b/chat',
      viewer: ChatViewer
    },
    "watch": {
      icon: () => <FloatIcon path={friend} />,
      component: () => <ChatPanel />,
      path: 'a/b/chat',
      viewer: ChatViewer
    },
    "account": {
      icon: () => <FloatIcon path={avatar} />,
      component: Settings,
      path: 'a/b/form',
      viewer: SettingsViewer
    },
    "search": {
      icon: () => <FloatIcon path={magnifyingGlass} />,
      component: SearchPanel,
      path: 'a/b/folder',
      viewer: SearchViewer
    },
    "map": {
      icon: () => <FloatIcon path={map} />,
      component: MapTool,
      path: 'a/b/text',
      viewer: MapViewer
    },
    "db": {
      icon: () => <FloatIcon path={circleStack} />,
      component: DatabaseTool,
      path: 'a/b/text',
      viewer: DatabaseViewer
    },
    "tools": {
      icon: () => <FloatIcon path={addTools} />,
      component: () => <div>tools</div>,
      path: 'a/b/text',
      viewer: () => <div>tools</div>
    },
  }

  export const [tools, setTools] = createSignal(builtinTools)
