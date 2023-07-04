import { Icon } from "solid-heroicons"

import { createSignal } from "solid-js";
import { Tool } from "../core";
import { EditTool, EditViewer } from "./edit";
import { FloatIcon } from "./home";
import { MapTool, MapViewer } from "./map";
import { SearchPanel, SearchViewer } from "./search";
import { Settings, SettingsViewer } from "./settings";
import { ChatPanel, ChatViewer, DatabaseTool, DatabaseViewer } from "./viewer";
import { squaresPlus as addTools, signalSlash, bars_3 as menu, user as avatar, clock as history, pencil, chatBubbleBottomCenter as friend, magnifyingGlass, map, plusCircle, circleStack } from "solid-heroicons/solid";
// the tools are a mix of defaults, site specific, and user specific.
// overall the user should be in control though.





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
