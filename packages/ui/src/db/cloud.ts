
// the cloud is to lease sites and to authorize log writes to the lessee
// this will also be the lobby for exchanging 
import { Site } from "../lib/crypto";

// transactions are written to the cloud, blobs are authorized and written directly.

interface LeaseInfo {
    until: number
    credential: Uint8Array  // you can show you have this lease

}
// webrtc invite
interface InviteInfo {

}

export interface Cloud {
    // returns cbor lease or webrtc invitation to connect to the current lease holder.
    // transactions to the leaseholder 
    lease(id: number, credential: Uint8Array): Promise<LeaseInfo|InviteInfo>
    revoke(lease: number): Promise<void>
    // backup
    write(lease: number, data: Uint8Array): Promise<Uint8Array> 
    // authorize a blob. page name will include author id, so you can only overwrite your own data, and the transaction will have a sha256 so no shenanigans.
    authorize(site: number, credential: Uint8Array): Promise<Uint8Array>
}