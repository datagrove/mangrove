import { Channel, TransferableResult } from "../abc/rpc"
import { get } from 'sortablejs';
import { OpfsApi } from "./mvr_shared";


interface FileSystemSyncAccessHandle {
    getSize(): number
    read(buffer: ArrayBuffer, options: { at: number }): number
    write(buffer: ArrayBuffer, options: { at: number }): number
    truncate(size: number): void
    flush(): void
    close(): void
}
// should probably use shared array buffer, maybe atomics. like io uring or aeron
export class OpfsWorker {
    next = 32
    files = new Map<number, FileSystemSyncAccessHandle>()
    constructor(public root: FileSystemDirectoryHandle) {
    }

    static async create() {
        const root = await navigator.storage.getDirectory();
        const untitledFile = await root.getFileHandle("temp", { "create": true });
        return new OpfsWorker(root)
    }


    async getSize(fd: number): Promise<number> {
        const writable = this.files.get(fd)
        if (writable) {
            return writable.getSize()
        }
        return 0
    }
    async open(path: string): Promise<number> {
          
        const untitledFile = await this.root.getFileHandle(path, { "create": true });
        const accessHandle :  FileSystemSyncAccessHandle = await (untitledFile as any).createSyncAccessHandle();
        const fd = this.next++
        this.files.set(fd, accessHandle)
        return fd
    }
    async close(fd: number): Promise<void> {
        const writable = this.files.get(fd)
        if (writable) {
            await writable.close()
        }
    }
    async read(fd: number,at: number, readSize: number): Promise<TransferableResult> {
        const writable = this.files.get(fd)
        if (writable) {
            const readBuffer = new ArrayBuffer(readSize);
            const sz = writable.read(readBuffer, { "at": at });
            return new TransferableResult(readBuffer, [readBuffer])
        }
        return new TransferableResult(new Uint8Array(0), [])
    }
    async write(fd: number,at: number, data: Uint8Array): Promise<void> {
        const writable = this.files.get(fd)
        if (writable) {
            const writeSize = writable.write(data, { "at": at });
        }
    }

    connect(ch: Channel): OpfsApi {
        const r: OpfsApi = {
            open: this.open.bind(this),
            close: this.close.bind(this),
            read: this.read.bind(this),
            write: this.write.bind(this),
            getSize: this.getSize.bind(this)         
        }
        return r
    }


}