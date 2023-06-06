import { LexicalNode, EditorState, $getNodeByKey } from "lexical"
import { useLexicalComposerContext } from "./lexical-solid"



// there a two types of patches: "/node" and "/node/prop"

// JsonPatchable is the model we are assuming It is a tree of nodes, each node has a type and a set of properties.
export interface JsonPatchable {
  [key: string]: JsonNode
}
export interface JsonNode {
  parent?: string
  type: string
  prev?: string
  text?: string
  [key: string]: string | number | object | Array<string | number | object> | undefined
}
type JsonPatch = {
  op: "add" | "remove" | "replace"
  path: string
  value?: any
}

// not all properties should be synced. we should allow registering a node type and a way to sync it.
const registry = new Map<string, (n: LexicalNode) => JsonNode>()
export function registerNodeType(type: string, f: (n: LexicalNode) => JsonNode) {
  registry.set(type, f)
}

export const VOID = null as any as void
// export type HtmlDiff = {
//   add: JsonNode[]
//   update: PropDiff[]
//   remove: string[]
// }


//
export type PropDiff = {
  key: string  // key of the node we are changing
  add: [string, string | number | object | Array<string | number | object>][]
  remove: string[]
  // before?: any  // for debugging
  // now?: any
}

function propDiff(n: string, prev: JsonNode, now: JsonNode) {
  // modify
  let o: PropDiff = {
    key: n,
    add: [],
    remove: [],
    // before: prev,
    // now: now,
  }
  const nowx = now as any
  const prevx = prev as any
  for (let k of Object.keys(now)) {
    if (nowx[k] != prevx[k]) {
      o.add.push([k, nowx[k]])
    }
  }
  for (let k of Object.keys(prev)) {
    if (!nowx[k]) {
      o.remove.push(k)
    }
  }
  return o
}

function fromLexical(a: LexicalNode | null) {
  if (!a) return a
  const r: JsonNode = {
    type: a.getType(),
    text: a.getTextContent(),
    parent: a.getParent()?.getKey(),
    prev: a.getPreviousSibling()?.getKey(),
  }
  return r
}

const diffStates = (k: string, prevx: EditorState, nowx: EditorState, h: HtmlDiff) => {
  const now = fromLexical($getNodeByKey(k, nowx))
  const prev = fromLexical($getNodeByKey(k, prevx))
  console.log("wtf", k, now, prev)
  if (!prev && now) {
    // insert
    h.add.push(now)
  } else if (prev && !now) {
    // delete
    h.remove.push(k)
  } else if (now && prev) {
    let o = propDiff(k, prev, now)
    if (o.add.length + o.remove.length)
      h.update.push(o)
  }
}

function diff(prev: Map<string, JsonNode>, now: Map<string, JsonNode>) {
  for (let [k, now1] of now) {
    const h: HtmlDiff = {
      add: [],
      update: [],
      remove: []
    }
    let prev1 = prev.get(k)
    if (!prev1 && now1) {
      // insert
      h.add.push(now1)
    } else if (prev1 && !now1) {
      // delete
      h.remove.push(k)
    } else if (now1 && prev1) {
      let o = propDiff(k, prev1, now1)
      if (o.add.length + o.remove.length)
        h.update.push(o)
    }
  }
}

export function $getDirty(
  dirtyElements: string[],
  editorState: EditorState,
  prevEditorState: EditorState) {

  let now = new Map<string, JsonNode>()
  let prev = new Map<string, JsonNode>()
  editorState.read(() => {
    for (let k of dirtyElements) {
      const a = fromLexical($getNodeByKey(k))
      if (a) now.set(k, a)
    }
  })
  prevEditorState.read(() => {
    for (let k of dirtyElements) {
      const a = fromLexical($getNodeByKey(k))
      if (a) prev.set(k, a)
    }
  })
  return { now, prev }
}

export function sync(onChange: (diff: HtmlDiff) => void) {
  const [editor] = useLexicalComposerContext();

  editor.registerUpdateListener(
    ({ editorState, dirtyElements, dirtyLeaves, prevEditorState }) => {


      const dirty = [...dirtyElements.keys(), ...dirtyLeaves.keys()]
      const { now, prev } = $getDirty(dirty, editorState, prevEditorState)
      return diff(prev, now)
    })

}

