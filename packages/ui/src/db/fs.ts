

// build a file system on db

import { createDb } from "./db";
import { insert_file } from "./editor_schema";
import { Transaction } from "./schema";

// files are just channels?
// we need to figure out the type of the file to do this correctly?
// what might they be?



// 
export function npath(path: string) : number {
    return path.split('/').length
}
export function writeFile(tx: Transaction, path: string, data: ArrayBuffer) {

}
interface AsyncIterable {
    [Symbol.asyncIterator]() : AsyncIterator;
  }
  interface AsyncIterator {
    next() : Promise<IteratorResult>;
  }
  interface IteratorResult {
    value: any;
    done: boolean;
  }
export async function listFiles(path: string) {
    const db = createDb('dg')
    const q = db.query(`select * from files where npath=?`, npath(path))
    const files = await q.all()
    return files
}
export async function walkFiles( path: string) {
    const db = createDb('dg')
    const tx = db.begin()
    const q = tx.query(`select * from files where path like ?`, path + '%')
    const files = await q.all()
    return files
}

export async function uploadFiles(files: FileList, path: string) {
    const db = createDb('dg')
    const tx = db.begin()

    const pr = new Promise<void>((resolve, reject) => {
        let count = 0
        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            const reader = new FileReader()
            reader.onload = () => {
                const data = reader.result
                path = path + '/' + file.name
                insert_file(tx, {
                    id: 0,
                    npath: npath(path),
                    path: path,
                    type: file.type,
                    size: file.size,
                    mtime: Date.now(),
                    ctime: Date.now()
                })
                if (count++ === files.length) {
                    resolve()
                }
            }
            reader.readAsArrayBuffer(file)
        }
    })
    await pr

    tx.commit()
}