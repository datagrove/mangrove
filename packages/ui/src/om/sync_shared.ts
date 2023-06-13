// export interface JsonPatchable {
//     [key: string]: JsonNode
//   }

export type PositionMapPatch = {
}
export class PositionMap {

  update(p: PositionMapPatch) {
    return this
  }
  transform(p: number[]) : number[]{
    return p
  }
}
export type BufferApi = {
    setPath(path: string): void
    propose(p: JsonPatch[], version: number): void
  }
  export type JsonPatch = {
    op: "add" | "remove" | "replace"
    path: string
    value?: any
  }