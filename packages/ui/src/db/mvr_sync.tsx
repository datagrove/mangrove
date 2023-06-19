import { createSignal } from "solid-js"
import { $createRangeSelection, $getNodeByKey, $getRoot, $getSelection, ElementNode, LexicalEditor, LexicalNode, RootNode, TextNode } from "lexical"
import { LensServerApi, DgSelection, topologicalSort } from "./mvr_shared"
import { DgElement as DgElement } from "./mvr_shared"


function dg2lex(dg: DgElement, nl: LexicalNode) {
  const vx = dg as any
  if (nl instanceof TextNode) {
    nl.setTextContent(vx.text)
    //nl.__text = vx.text
  }
  nl.__format = vx.format
  nl.__mode = vx.mode
  nl.__style = vx.style
  nl.__direction = vx.direction
  nl.__indent = vx.indent
  nl.__type = vx.type
  nl.__version = vx.version
  nl.__listType = vx.listType
  nl.__start = vx.start
  nl.__tag = vx.tag
  nl.__rel = vx.rel
  nl.__target = vx.target
  nl.__title = vx.title
  nl.__url = vx.url
}

let cnt = 32
export class DocBuffer {
  _error: Error | undefined
  _id?: DgElement[] // only used for initializing.
  _editor?: LexicalEditor
  _debug = createSignal(`${cnt++}`)
  constructor(public api: LensServerApi, id: DgElement[]) {
    // this stores the document just until we have an editor to receive it.
    this._id = id
  }

  // recursive over children; are we clever enough to not repeat here though?
  // maybe we need a set of visited ids? how do we set lexical parents?
  // how to deal with text nodes? know when to stop?
  // coming from the server all the children are strings, not nodes.

  // assumes all children created first. assumes we are creating from scratch, not update.
  // must call inside editor context

  // how do we refer to these inserts? we need to let existing nodes be modified to reference them
  // potentially we need global ids to be namespaced from lexical ids (dg$), number?
  // maybe we need to send a different op rather than "all children"?
  $insert(inserted: Map<string, LexicalNode>, um: [string, string][], v: DgElement) {
    // use text node as default
    let nodeInfo = this._editor?._nodes.get(v.type);
    if (!nodeInfo) {
      nodeInfo = this._editor?._nodes.get("text");
    }
    let nl = new nodeInfo!.klass() as TextNode
    if (!nl) {
      throw new Error("can't create node for " + v.type)
    }
    dg2lex(v, nl)
    inserted.set(v.id, nl)

    let nds: LexicalNode[] = []
    for (let c of v.children ?? []) {
      // getNodeByKey doesn't work here if we just created the node.
      let n = inserted.get(c)
      if (!n) {
        console.log(`missing child, parent ${v.id} child ${c}`)
        continue
      }
      nds.push(n)
      nl.append(n)
    }
    um.push([v.id, nl.getKey()])
  }

  $updateProps(inserted: Map<string, LexicalNode>, v: DgElement) {
    const ln= $getNodeByKey(v.id)!
    // copy the properties to the new node
    dg2lex(v, ln)
    if (ln.getParent()) {
      ln.replace(ln)
    } else {
      const root = $getRoot()
      root.clear()
      for (let c of v.children ?? []) {
        const o = inserted.get(c) || $getNodeByKey(c)
        if (o) root.append(o)
      }
    }
  }

  // return the keys for every element created
  // with upd and del the id is already the lex key
  // with ins the id is the mvr key, create the lex key and return the pair.
  // we need to top sort this to make sure children are created before parents?
  // then we need to sync the children and the properties.
  async updatex(ins: DgElement[], upd: DgElement[], del: string[], selection: DgSelection): Promise<[string, string][]> {
    console.log("apply update to lexical", upd, del, selection)
    const um: [string, string][] = []
    const m = new Map<string, LexicalNode>()
    this._editor?.update(() => {
      ins.forEach(i => { this.$insert(m, um, i) })
      upd.forEach(u => { this.$updateProps(m, u) })
      del.forEach(d => { $getNodeByKey(d)?.remove() })
      const sel = $getSelection()
      const selr = $createRangeSelection()
      //$setSelection(null)
    })
    return um
  }


  // what about making the initial document into an insert?
  // there would be

  async subscribe(editor: LexicalEditor) {
    this._editor = editor
    // build the document and return the keymap
    // _id was already retrieved by open.
    const um: [string, string][] = []
    const [doc] = topologicalSort(this._id ?? [])
    const mr = doc[doc.length - 1]
    const top = new Set<string>(mr.children ?? [])
    const m = new Map<string, LexicalNode>()

    editor.update(() => {
      const root = $getRoot() as RootNode
      for (let v of doc) {
        //console.log("writing", doc)
        let nl = this.$insert(m, um, v)
        if (top.has(v.id)) {
          root.append()
        }
      }
    })
    this._id = undefined
    console.log("subscribe end", um)
    await this.api.subscribe(um)

    editor.registerUpdateListener(
      ({ editorState, dirtyElements, dirtyLeaves, prevEditorState }) => {

        // map a lexical node into something that can be sent to the worker
        // mostly overhead; should split lexical into worker component with reconciliation in the tab
        const fromLexical = (a: LexicalNode | null): DgElement | null => {
          if (!a) return a
          const en = a instanceof ElementNode ? a as ElementNode : null
          const r: DgElement = {
            id: a.getKey(),
            parent: a.getParent()?.getKey(),
            v: 0,
            conflict: "",
            type: a.getType(),
            children: en?.getChildrenKeys() ?? [],
          }

          if (a instanceof TextNode) {
            let rx = r as any
            rx.text = a.__text
            rx.format = a.__format
            rx.mode = a.__mode
            rx.style = a.__style
          }
          return r
        }


        const dirty = [...dirtyElements.keys(), ...dirtyLeaves.keys()]
        let upd: DgElement[] = []
        let del: string[] = []
        let sel: DgSelection = []
        editorState.read(() => {
          for (let k of dirty) {
            const a = fromLexical($getNodeByKey(k))
            if (a) upd.push(a)
            else del.push(k)
          }
          const selx = $getSelection()
        })

        // this should check for a change in selection
        if (upd.length > 0 || del.length > 0 || sel.length > 0)
          this.api.update(upd, del, sel)
      })

  }
}
