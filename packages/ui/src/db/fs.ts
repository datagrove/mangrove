

// build a file system on db

import { createDb } from "./db";

// files are just channels?
// we need to figure out the type of the file to do this correctly?
// what might they be?


export function uploadFiles(files: FileList, path: string) {
    const db = createDb('dg')

    for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const reader = new FileReader()
        reader.onload = () => {
            const data = reader.result
            if (typeof data === 'string') {
                db.put(path + file.name, data)
            }
        }
        reader.readAsText(file)
    }
}