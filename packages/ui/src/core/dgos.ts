

// code needed to communicate with enclosing iframe
let webview = (window as any).chrome?.webview
if (webview) {
    // webview.addEventListener('message', (x: MessageEvent) => {
    //   let [a, b] = x.data.split("!~~!")
    //   setTitle(a)
    //   ed.text = b
    //   console.log(x, a, b)
    // })
    // reply("!~~!")
  }


  /*
  
function Button(props: {
  onClick: () => void,
  class: string,
  children: JSXElement
}) {
  return <button onclick={props.onClick} class={`${props.class} inline-flex items-center rounded-md border border-transparent px-3 py-2 text-sm font-medium leading-4 text-white shadow-sm  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}>{props.children}</button>
}

// when we paste we should try to understand if its markdown or html we are pasting
// convert markdown to html
function DialogBar() {
    function reply(x: string) {
      if (webview) {
        webview.postMessage(x)
      } else {
        console.log("no webview", x)
      }
    }
    async function save() {
      const x = ed.text
      console.log("save", x)
      reply(await html2md(ed.text))
    }
    const cancel = () => {
      reply(original)
    }
    onmessage = (e) => {
      console.log(e)
      original = e.data
      md2html(e.data).then(e => {
        ed.text = e
      })
    }
    <div class='h-8 bg-neutral-800 p-1 flex '>
    <Button onClick={save} class='mx-1 bg-indigo-600 hover:bg-indigo-700'>{ln().save}<Icon class='ml-1 h-4 w-4' path={check} /></Button>
    <p class='flex-1 text-center'></p>
    <Button onClick={cancel} class='mx-1 bg-red-600 hover:bg-red-700'>{ln().cancel}<Icon class='ml-1 h-4 w-4' path={xMark} /></Button>
    </div>
}

*/