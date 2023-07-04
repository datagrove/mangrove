

class SlottedPage {
    pageSize: number;
    headerSize: number;
    slotSize: number;
    data: Uint8Array;

    constructor(pageSize: number, headerSize: number) {
        this.pageSize = pageSize;
        this.headerSize = headerSize;
        this.slotSize = 4; // Assuming each slot entry is 4 bytes (uint32)

        // Initialize the data array
        this.data = new Uint8Array(pageSize);
        this.setFreeSpacePointer(headerSize);
        this.setSlotCount(0);
    }

    private getFreeSpacePointer(): number {
        return this.readUint32(0);
    }

    private setFreeSpacePointer(pointer: number): void {
        this.writeUint32(0, pointer);
    }

    private getSlotCount(): number {
        return this.readUint32(4);
    }

    private setSlotCount(count: number): void {
        this.writeUint32(4, count);
    }

    private getSlotOffset(index: number): number {
        const slotOffset = this.headerSize + this.slotSize * index;
        return this.readUint32(slotOffset);
    }

    private setSlotOffset(index: number, offset: number): void {
        const slotOffset = this.headerSize + this.slotSize * index;
        this.writeUint32(slotOffset, offset);
    }

    private readUint32(offset: number): number {
        const view = new DataView(this.data.buffer, offset, 4);
        return view.getUint32(0, false);
    }

    private writeUint32(offset: number, value: number): void {
        const view = new DataView(this.data.buffer, offset, 4);
        view.setUint32(0, value, false);
    }

    insert(data: Uint8Array): number | null {
        const requiredSpace = data.length + this.slotSize;
        const freeSpacePointer = this.getFreeSpacePointer();
        const slotCount = this.getSlotCount();

        if (freeSpacePointer + requiredSpace > this.pageSize) {
            return null; // Not enough space in the page
        }

        const slotIndex = slotCount;
        const dataOffset = freeSpacePointer;
        const slotOffset = this.headerSize + this.slotSize * slotIndex;

        this.setFreeSpacePointer(freeSpacePointer + requiredSpace);
        this.setSlotCount(slotCount + 1);
        this.setSlotOffset(slotIndex, dataOffset);

        // Copy data to the page
        this.data.set(data, dataOffset);

        return slotIndex;
    }

    getData(slotIndex: number): Uint8Array | null {
        const slotOffset = this.getSlotOffset(slotIndex);
        if (slotOffset === undefined) {
            return null; // Invalid slot index
        }

        const nextSlotOffset = this.getSlotOffset(slotIndex + 1);
        const dataLength = nextSlotOffset !== undefined ? nextSlotOffset - slotOffset : undefined;

        return this.data.subarray(slotOffset, slotOffset + dataLength);
    }
}
