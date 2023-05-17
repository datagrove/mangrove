import { createRoot } from 'react-dom/client';
import { Excalidraw } from "@excalidraw/excalidraw";

export function newExcalidraw(domNode) {
    const root = createRoot(domNode);
    root.render(<Excalidraw /> );
}