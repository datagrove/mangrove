
// these shuffle work to the index worker
export function indexFiles( ){

}

export function reindex(){

    
}



import { Db, exec } from ".";
// build a file system on db

import { FileTuple, insert_file, select_file, select_file_recursive } from "./editor_schema";
import { npath } from "./mvr_shared";

// files are just channels?
// we need to figure out the type of the file to do this correctly?
// what might they be?


export async function select_files(db: Db, path: string) : Promise<FileTuple[]> {
    return exec(db,select_file, {npath: npath(path), path: path})
}
export async function select_files_recursive(db: Db, path: string) : Promise<FileTuple[]> {
    return exec(db,select_file_recursive, { path: path+'%'})
}

// 

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


export async function uploadFiles(db: Db,files: FileList, path: string) {
    const tx = db.begin("localhost")

    const pr = new Promise<void>((resolve, reject) => {
        let count = 0
        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            const reader = new FileReader()
            reader.onload = () => {
                const data = reader.result
                path = path + '/' + file.name
                insert_file(tx, {
                    id: 0,  // id's only unique locally
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

function createDb(arg0: string) {
    throw new Error("Function not implemented.");
}

