import { createContext, useContext } from "solid-js"
import { Cloud } from "./rpc"

// we have the actual host, then we also need to connect to it.
export const CloudContext = createContext<Cloud>()
export const useCloud = () => { return useContext(CloudContext) }


// export interface Cloud {
//     connect(url: string,status: (online: boolean)=>void ): Promise<Peer>
//     disconnect(peer: Peer): void
// }