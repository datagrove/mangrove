
import { faker } from '@faker-js/faker'
import { BuilderFn, EstimatorFn, Scroller, ScrollerProps } from './scroll'
import { createEffect, onCleanup } from 'solid-js'

import { createSignal, JSXElement, onMount } from 'solid-js'
import { render } from 'solid-js/web'
import { Icon } from 'solid-heroicons'
import { xMark, check } from 'solid-heroicons/solid'

import { Editor } from './editor'
import { html2md, md2html } from './md'
import { ln, setLn } from './i18n'
import './editor.css'
// one kind of 

// global css class?
const redFrame = "border-solid border-2 border-red-500"
const greenFrame = "border-solid border-2 border-green-500"
const clearFrame = "border-solid border-0 border-opacity-0"

// note the potential danger but need of using html messages here! whitelist is going to be painful. Even markdown doesn't save us because of mdx.
export interface FakeEntry {
    message: string
    avatar: string
}

const Td = (props: { children?: JSXElement }) => {
    return <td>{props.children}</td>
}
const Th = (props: { children?: JSXElement }) => {
    return <td>{props.children}</td>
}
interface ResizeData {
    startX: number;
    startWidth: number;
  }
  
  function enableColumnResizing(table: HTMLTableElement) {
    const headers = table.getElementsByTagName('th');
  
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      header.classList.add('th-resize-handle');
  
      header.addEventListener('mousedown', (event: MouseEvent) => {
        const resizeData: ResizeData = {
          startX: event.pageX,
          startWidth: header.offsetWidth,
        };
  
        document.addEventListener('mousemove', handleColumnResize, false);
        document.addEventListener('mouseup', stopColumnResize, false);
      });
    }
  
    function handleColumnResize(event: MouseEvent) {
        
      const header = event.target! as HTMLElement;
      const columnIndex = Array.from(header.parentNode!.children).indexOf(header);
  
      const resizeData = (header as any).resizeData as ResizeData;

      const widthDiff = event.pageX - resizeData.startX;
      const newWidth = Math.max(0, resizeData.startWidth + widthDiff);
  
      header.style.width = newWidth + 'px';
      console.log("resize",resizeData)

      const tableRows = table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
      for (let i = 0; i < tableRows.length; i++) {
        const row = tableRows[i];
        const cell = row.children[columnIndex] as HTMLElement;
        cell.style.width = newWidth + 'px';
      }
    }
  
    function stopColumnResize() {
      document.removeEventListener('mousemove', handleColumnResize, false);
      document.removeEventListener('mouseup', stopColumnResize, false);
    }
  }
  

  
const enableColumnDragging = (table: HTMLTableElement) => {
    const headers = table.getElementsByTagName('th');
  
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      header.draggable = true;
      header.classList.add('th-drag-handle');
  
      header.addEventListener('dragstart', (event: DragEvent) => {
        event.dataTransfer!.setData('text/plain', i.toString());
      });
  
      header.addEventListener('dragover', (event: DragEvent) => {
        event.preventDefault();
      });
  
      header.addEventListener('drop', (event: DragEvent) => {
        event.preventDefault();
        const sourceIndex = parseInt(event.dataTransfer!.getData('text/plain'));
        const targetIndex = i;
  
        if (sourceIndex !== targetIndex) {
          const rows = Array.from(table.getElementsByTagName('tr'));
  
          rows.forEach((row) => {
            const cells = Array.from(row.children);
            const sourceCell = cells[sourceIndex];
            const targetCell = cells[targetIndex];
  
            if (targetIndex > sourceIndex) {
              row.insertBefore(sourceCell, targetCell.nextSibling);
            } else {
              row.insertBefore(sourceCell, targetCell);
            }
          });
        }
      });
    }
  }
  

  
// make draggable headers
export function FakeScroll() {
    let el: HTMLTableElement

    createEffect(()=>{
        // enableColumnDragging(el)
        enableColumnResizing(el)
    })

    return     <table ref={el!} id="myTable" class='border-collapse w-full'>
        <thead>
    <tr>
      <th>Column 1</th>
      <th>Column 2</th>
      <th>Column 3</th>
    </tr></thead>
    <tbody>
    <tr>
      <td>Value 1-1</td>
      <td>Value 1-2</td>
      <td>Value 1-3</td>
    </tr>
    <tr>
      <td>Value 2-1</td>
      <td>Value 2-2</td>
      <td>Value 2-3</td>
    </tr>
    </tbody>
  </table>
}

export function FakeScroll2() {
    let el: HTMLDivElement
    // we can try to recreate the editor as raw typescript to make it easier to wrap in various frameworks. 
    const ed = new Editor
    let edel: HTMLDivElement
    let tombstone: HTMLDivElement
    const [debugstr, setDebugstr] = createSignal("woa")

    const items = [...new Array(100)].map((e, i) => {
        return [...new Array(10)].map((v, j) => i + "," + j + ". " + faker.lorem.word())
    })

    onMount(() => {
        ed.mount(edel)
        ed.text = "בְּרֵאשִׁ֖ית בָּרָ֣א אֱלֹהִ֑ים אֵ֥ת הַשָּׁמַ֖יִם וְאֵ֥ת הָאָֽרֶץ׃"

        let tombstoneHeight_ = tombstone.offsetHeight
        tombstone.style.display = 'none'

        const est: EstimatorFn = (start: number, end: number) => {
            const r = (end - start) * 24
            console.log("est", start, end, tombstoneHeight_, r)
            return r
        }

        const bld: BuilderFn = (old: HTMLElement, row: number, column: number) => {
            let d = items[row]
            old.innerHTML = `<p class='p-4'>${d[column]}<p>`
        }
        const props: ScrollerProps = {
            container: el!,
            rows: items.length,
            columns: 10,
            builder: bld,
            height: est,
        }
        const s = new Scroller(props)
        setDebugstr(JSON.stringify(s, null, 2))
        const r = () => {
            // we should be able to adjust grid options here.
            // maybe just use update?
            s.onResize_()

        }
        window.addEventListener('resize', r);
        onCleanup(() => {
            // any value to explicit destruction here?
            window.removeEventListener('resize', r);
        })
    })


    return <>
        <pre class=' fixed top-0 left-0 overflow-auto w-64 h-screen z-50 bg-black'>
            {debugstr()}
        </pre>
        <div class={'right-0 top-0 bottom-32 left-80 absolute overflow-y-auto overflow-x-hidden h-screen' + clearFrame} ref={el!}>

        </div>
        <div class='right-0 bottom-0 left-80 absolute overflow-y-auto overflow-x-hidden h-32  ' >
            <div class='h-full w-full max-w-none prose dark:prose-invert' ref={edel!} />
        </div>

        <p ref={tombstone!}>&nbsp;</p>

    </>

}



