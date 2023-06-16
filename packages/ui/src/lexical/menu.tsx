import { Show, createEffect, createSignal, onCleanup, onMount } from "solid-js"
import { useLexicalComposerContext } from "./lexical-solid";
import { on } from "events";
import { $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND } from "lexical";
import { Portal } from "solid-js/web";
import { computePosition, flip } from '@floating-ui/dom'

// link dialog
// slash menu 
// text dialog (apply to seletion)
// color dialog
// ... -> menu
// @ reference 
// keyboard emoji reference
// quote / reply to?


export type FloatingMenuCoords = { x: number; y: number } | undefined;
interface SbProps {
    onClick: () => void
    isActive: boolean
    children: any
}
function Sb(props: SbProps) {
    return <button class={`p-2 block rounded-md ${props.isActive ? "text-blue-600" : ""}`} onClick={props.onClick}>{props.children}</button>
}

export function usePointerInteractions() {
    const [isPointerDown, setIsPointerDown] = createSignal(false);

    createEffect(() => {
        const handlePointerUp = () => {
            setIsPointerDown(false);
            document.removeEventListener("pointerup", handlePointerUp);
        };

        const handlePointerDown = () => {
            setIsPointerDown(true);
            document.addEventListener("pointerup", handlePointerUp);
        };

        document.addEventListener("pointerdown", handlePointerDown);
        onCleanup(() => {
            document.removeEventListener("pointerdown", handlePointerDown);
        });
    });

    return isPointerDown as () => boolean;
}

export function TextMenu() {
    let el: HTMLDivElement
    const isPointerDown = usePointerInteractions();
    const [state, setState] = createSignal({
        isBold: false,
        isCode: false,
        isItalic: false,
        isStrikethrough: false,
        isUnderline: false,
    })
    const [pos, setPos] = createSignal<FloatingMenuCoords>(undefined)
    const clear = () => setPos(undefined)

    const open = () => {
        const sel = getSelection();
        const domRange = sel?.rangeCount !== 0 && sel?.getRangeAt(0);
        if (domRange) {
            computePosition(domRange, el, { placement: "top", middleware: [flip()], }).then(pos => {
                setPos(pos)
            })
        } else {
            console.log("range", sel)
        }
    }
    const [trigger, setTrigger] = createSignal(false)
    createEffect(() => {
        if (!isPointerDown() && trigger()) {
            open()
            setTrigger(false)
        }
    })
    // we should check for a selection whenever the mouseup fires or mousedown

    // after we get a selection, the next time the pointer releases we should open the menu
    // then the next time the pointer releases we should close the menu
    const upd = () => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || selection._cachedNodes == null) return clear()
        console.log("sel", selection)
        setState({
            isBold: selection.hasFormat("bold"),
            isCode: selection.hasFormat("code"),
            isItalic: selection.hasFormat("italic"),
            isStrikethrough: selection.hasFormat("strikethrough"),
            isUnderline: selection.hasFormat("underline"),
        });
        if (!isPointerDown()) setTimeout(open)// next mouse up should open
        else {
            // should open on next mouse up
            setTrigger(true)
        }
    }
    const [editor] = useLexicalComposerContext();
    onMount(() => {
        let unregisterListener = editor.registerUpdateListener(
            ({ editorState }) => {
                editorState.read(() => upd());
            }
        );
        onCleanup(() => {
            unregisterListener()
        })

    })

    // these have to be state buttons that change their background color
    const bold = () => {
        state().isBold = !state().isBold
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
    }
    const italic = () => {
        state().isItalic = !state().isItalic
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
    }
    const strike = () => {
        state().isStrikethrough = !state().isStrikethrough
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
    }
    const underline = () => {
        state().isUnderline = !state().isUnderline
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
    }
    const code = () => {
        state().isCode = !state().isCode
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code");
    }
    return <div
        ref={el!} class='flex fixed border  border-neutral-700  rounded-md bg-neutral-800 text-white ' style={{
            left: (pos()?.x ?? 0) + "px",
            top: (pos()?.y ?? 0) + "px",
            "z-index": 1000,
            display: pos() ? "flex" : "none"
        }}>
        <Sb isActive={state().isBold} onClick={bold}><span class='font-bold'>B</span></Sb>
        <Sb isActive={state().isItalic} onClick={italic}><span class='italic'>I</span></Sb>
        <Sb isActive={state().isUnderline} onClick={underline}><span class='underline'>U</span></Sb>
        <Sb isActive={state().isStrikethrough} onClick={strike}><span class='line-through'>S</span></Sb>
        <Sb isActive={state().isCode} onClick={code}><span >{"<>"}</span></Sb>
    </div>

}

// class={`p-2 block font-bold w-6 ${state().isBold ? 'text-blue-500' : ""} `} 