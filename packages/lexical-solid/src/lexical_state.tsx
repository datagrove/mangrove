import { onMount } from "solid-js"
import { useSyncPath } from "../../datagrove-solid/src"
import { useLexicalComposerContext } from "./lexical-solid"

export function Sync() {
    const st = useSyncPath()
    const [editor] = useLexicalComposerContext()
  
    onMount(async () => {
      console.log("sync", st, editor)
      st?.subscribe(editor)
    })
  
    return <></>
  }