import { LexicalNode, EditorState, $getNodeByKey, TextNode } from "lexical"
import { useLexicalComposerContext } from "./lexical-solid"
import { useLexical } from "./RichTextEditor"
import { onMount } from "solid-js"
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
  [key: string]: any
}
export type JsonPatch = {
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

function propDiff(n: string, prev: JsonNode, now: JsonNode) : JsonPatch[]{
  const o : JsonPatch[] = []
  const nowx = now as any
  const prevx = prev as any

  for (let k of Object.keys(now)) {
    if (nowx[k] != prevx[k]) {
      o.push({
        op: "replace",
        path: `${n}/${k}`,
        value: nowx[k]
      })
    }
  }
  for (let k of Object.keys(prev)) {
    if (nowx[k]!=prevx[k] && !nowx[k]) {
      o.push({
        op: "remove",
        path: `${n}/${k}`
      })
    }
  }
  //console.log("propdiff", n, prev, now,o)
  return o
}

function fromLexical(a: LexicalNode | null) {
  if (!a) return a
  const r: JsonNode = {
    type: a.getType(),
    parent: a.getParent()?.getKey(),
    prev: a.getPreviousSibling()?.getKey(),
  }
  
  if (a instanceof TextNode) {
      r.text = a.__text
      r.format = a.__format
      r.mode = a.__mode
      r.style = a.__style
  }
  return r
}

function diff(prev: Map<string, JsonNode>, now: Map<string, JsonNode>) : JsonPatch[]{
  const o : JsonPatch[] = []
  for (let [k, now1] of now) {
    let prev1 = prev.get(k)
    //console.log("diff", k, prev1, now1)
    if (!prev1 && now1) {
      // insert
      o.push({
        op: "add",
        path: k,
        value: now1,
      })
    } else if (prev1 && !now1 ) {
      // delete
      o.push({
        op: "remove",
        path: k,
        value: now1,
      })
    } else if (now1 && prev1) {
      o.push(...propDiff(k, prev1, now1))
    }
  }
  return o
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

export function sync(onChange: (diff: JsonPatch[]) => void) {
  const [editor] = useLexicalComposerContext();


}

export function Sync(props: { path?: string }) {
  const prov = useLexical()!
  const [editor] = useLexicalComposerContext()

  const update = (diff: JsonPatch[]) => {
    editor.update(() => {
      for (let o of diff) {

      }
    })
  }

  onMount(async () => {
    if (props.path) {
      // this should register us; maybe return a channel? an api?
      // we can send the the updates through the channel and watch the channel for updates.
      // we don't even need channels because this is always messagechannels
      // api is pretty limited so not worth dragging in that?
      const [data,upd] = await prov.open(props.path, update)
      editor.update(()=>{
        const editorState = editor.parseEditorState(data)
        editor.setEditorState(editorState);
      })   
      editor.registerUpdateListener(
      ({ editorState, dirtyElements, dirtyLeaves, prevEditorState }) => {
        const dirty = [...dirtyElements.keys(), ...dirtyLeaves.keys()]
        const { now, prev } = $getDirty(dirty, editorState, prevEditorState)
        upd(diff(prev, now))
      })
    }
 
  })



  return <></>
}
