

// build a file system on db

import { Tx } from "./data";
import { Transaction, createDb } from "./db";

// files are just channels?
// we need to figure out the type of the file to do this correctly?
// what might they be?

function insert_file(tx: Transaction, name: string, data: any, modified: number){

}

export async function uploadFiles(files: FileList, path: string) {
    const db = createDb('dg')
    const tx = db.begin()

    for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const reader = new FileReader()
        reader.onload = () => {
            const data = reader.result
            
                insert_file(tx, file.name, data, file.lastModified)
            
        }

        reader.readAsArrayBuffer(file)
    }
    tx.commit()
}