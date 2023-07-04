const pageSize = 16;
class BTreeNode<T> {
    keys: T[];
    children: BTreeNode<T>[];
    count: number;

    constructor() {
        this.keys = [];
        this.children = [];
        this.count = 0;
    }
}

class CountedBTree<T> {
    root: BTreeNode<T>;

    constructor() {
        this.root = new BTreeNode<T>();
    }

    insert(key: T) {
        if (this.root.count === 2 * pageSize - 1) {
            const newRoot = new BTreeNode<T>();
            newRoot.children.push(this.root);
            this.root = newRoot;
            this.splitChild(this.root, 0);
        }
        this.insertNonFull(this.root, key);
    }

    private insertNonFull(node: BTreeNode<T>, key: T) {
        let i = node.count - 1;
        if (node.children.length === 0) {
            // Leaf node
            while (i >= 0 && key < node.keys[i]) {
                node.keys[i + 1] = node.keys[i];
                i--;
            }
            node.keys[i + 1] = key;
            node.count++;
        } else {
            // Internal node
            while (i >= 0 && key < node.keys[i]) {
                i--;
            }
            i++;
            if (node.children[i].count === 2 * pageSize - 1) {
                this.splitChild(node, i);
                if (key > node.keys[i]) {
                    i++;
                }
            }
            this.insertNonFull(node.children[i], key);
        }
    }

    private splitChild(node: BTreeNode<T>, index: number) {
        const child = node.children[index];
        const newNode = new BTreeNode<T>();

        node.keys.splice(index, 0, child.keys[pageSize - 1]);
        node.count++;

        newNode.keys = child.keys.splice(pageSize, pageSize - 1);
        newNode.count = pageSize - 1;

        if (child.children.length > 0) {
            newNode.children = child.children.splice(pageSize, pageSize);
        }

        node.children.splice(index + 1, 0, newNode);
    }

    searchByPosition(position: number): T | null {
        const result = this.searchByPositionRecursive(this.root, position);
        return result !== null ? result.key : null;
    }

    private searchByPositionRecursive(
        node: BTreeNode<T>,
        position: number
    ): { key: T; position: number } | null {
        let currentPos = 0;
        let i = 0;

        while (i < node.count && currentPos + node.children[i].count <= position) {
            currentPos += node.children[i].count;
            i++;
        }

        if (currentPos === position) {
            return { key: node.keys[i], position: position };
        }

        if (node.children.length === 0) {
            return null;
        }

        if (currentPos < position) {
            return this.searchByPositionRecursive(
                node.children[i + 1],
                position - currentPos - 1
            );
        } else {
            return this.searchByPositionRecursive(node.children[i], position);
        }
    }
}

type XX = BTreeNode<Uint8Array>;

let x = new Uint8Array
let y = new Uint8Array
const a = x < y

