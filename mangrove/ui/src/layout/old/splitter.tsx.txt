import { createSignal, JSX , Component, createEffect, onCleanup } from 'solid-js';
import { throttle } from '@solid-primitives/scheduled';

type SolidRef = (el: HTMLDivElement) => void;
export const GridResizer: Component<{
  ref: HTMLDivElement | SolidRef;
  onResize: (clientX: number, clientY: number) => void;
  size: ()=>number
}> = (props) => {

  // we need to store the original client x so that we can send deltas.
  let startSize = props.size()
    let startX=0
    let startY = 0
  const [isDragging, setIsDragging] = createSignal(false)

  const onResizeStart = (e: MouseEvent) => {
    startSize = props.size()
    startX = e.clientX
    startY = e.clientY
    setIsDragging(true)
  }
  const onResizeStartTouch = (e: TouchEvent) => {
    startSize = props.size()
    const touch = e.touches[0];
    startX = touch.clientX
    startY = touch.clientY
    setIsDragging(true)
  }
  const onResizeEnd = () => {
    setIsDragging(false)
  }
  // convert from 
  const resize = (x: number, y:number) => {
    props.onResize(startSize + x-startX, y-startY)
  }

  const onMouseMove = throttle((e: MouseEvent) => {
    resize(e.clientX, e.clientY);
  }, 10);

  const onTouchMove = throttle((e: TouchEvent) => {
    const touch = e.touches[0];
    resize(touch.clientX, touch.clientY);
  }, 10);

  const setRef = (el: HTMLDivElement) => {
    (props.ref as SolidRef)(el);

    el.addEventListener('mousedown', onResizeStart);
    el.addEventListener('touchstart', onResizeStartTouch);

    onCleanup(() => {
      el.removeEventListener('mousedown', onResizeStart);
      el.removeEventListener('touchstart', onResizeStartTouch);
    });
  };

  createEffect(() => {
    if (isDragging()) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onResizeEnd);
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', onResizeEnd);
    } else {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onResizeEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onResizeEnd);
    }
  });

  // the of the line can be a parameter? or just some extra classes
  // maybe the actual component should be?
  return (
    <div
      ref={setRef}
      class="w-full  hover:bg-neutral-500  group flex items-center justify-center flex-col cursor-col-resize  "
      classList={{
        'bg-neutral-500': isDragging(),
       }}
    >
      <div
        class='cursor-col-resize'
        classList={{
          'fixed inset-0 z-10': isDragging(),
          'hidden': !isDragging(),
        }}
      />

    </div>
  );
};

{/* <Dot isDragging={isDragging()} />
<Dot isDragging={isDragging()} />
<Dot isDragging={isDragging()} /> */}

// export const clampPercentage = (percentage: number, lowerBound: number, upperBound: number) => {
//     return Math.min(Math.max(percentage, lowerBound), upperBound);
// }



// change this from fr to px; we don't want changing the window size to automatically change the splitter position.

export const Splitter = ({ children,left,setLeft }: { 
    children: JSX.Element[],
    left: ()=>number,
    setLeft: (n: number)=>void
 }) => {
    let resizer!: HTMLDivElement
    let grid!: HTMLDivElement

    // this gets a x,y from the mouse.
    // we need to adjust clientX based on where left started?
    // 
    const changeLeft = (clientX: number, clientY: number) => {
        console.log("changeLeft", left(), clientX)
        setLeft(clientX);
        // const rect = grid.getBoundingClientRect();
        // let position = clientX - rect.left - resizer.offsetWidth / 2;
        // let size = grid.offsetWidth - resizer.offsetWidth;
        // const percentage = position / size;
        // const percentageAdjusted = clampPercentage(percentage * 2, 0.5, 1.5);
        // setLeftContent(percentageAdjusted);
    }

    // this is feeding css variables to the grid.
    // 
    return <div
        ref={grid}
        class=" w-full h-full min-h-0 font-sans"
        style={{
            "grid-template-columns": `${left()}px 12px 1fr`,           
            "display": "grid",
        }}
    >
        <div class=' relative h-full w-full overflow-y-auto  flex  bg-color-black'>
            {children[0]!}

        </div>
        <GridResizer ref={resizer} size={left} onResize={changeLeft} />
        {children[1]!}

    </div>
}

/*
.wrapper {
  grid-template-rows: minmax(0, 1fr);
  
*/

// export const Dot: Component<{ isDragging: boolean }> = (props) => {
//   return (
//     <span
//       class=" hidden m-1 h-1 w-1 rounded-full bg-slate-300 dark:bg-white dark:group-hover:bg-slate-200"
//       classList={{
//         'bg-slate-200': props.isDragging,
//         'dark:bg-slate-200': props.isDragging,
//       }}
//     />
//   );
// };
