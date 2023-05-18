import { Maybe } from "../core";
import { SiteDocument } from "./store";

// tries to load the document from the database
export async function getDocument(did: string, site: string, path: string): Maybe<SiteDocument> {
    return [{
        site: {
            did: did,
            name: "datagrove",
            caps: {
                read: true,
                write: true,
                admin: true,
            }
        },
        path: path,
        type: path
    }, undefined]
}
