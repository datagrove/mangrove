import { useLocation } from "@solidjs/router"
import { JSXElement, createContext, useContext } from "solid-js"

export const DatagroveContext = createContext<DatagroveValue>()
export function useDg() : DatagroveValue { 
  const r = useContext(DatagroveContext) 
  if (!r) throw "wrap with <Datagrove/>"
  return r
}


export class DatagroveValue {

  constructor(public loc: any){}
}

export function Datagrove(props: { children: JSXElement }) {
    const loc = useLocation()
    const u = new DatagroveValue(loc)
    return <DatagroveContext.Provider value={u}>
      {props.children}
    </DatagroveContext.Provider>
  }
  