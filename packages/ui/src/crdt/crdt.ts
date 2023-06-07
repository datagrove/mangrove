import { decode } from "cbor-x";
import { createSignal } from "solid-js";

export interface Op {
	ty: string;
	ix: number;
	pri?: number;
	ch?: string;
	id: number;
}


