import { createContext, useContext } from "solid-js"
import { Connector } from "./cloud"

// we have the actual host, then we also need to connect to it.
export const CloudContext = createContext<Connector>()
export const useCloud = () => { return useContext(CloudContext) }


// export interface Cloud {
//     connect(url: string,status: (online: boolean)=>void ): Promise<Peer>
//     disconnect(peer: Peer): void
// }