import { useLexicalComposerContext } from "../lexical/lexical-solid"

export function Sync() {
    const st = useSyncPath()
    const [editor] = useLexicalComposerContext()
  
    onMount(async () => {
      console.log("sync", st, editor)
      st?.subscribe(editor)
    })
  
    return <></>
  }