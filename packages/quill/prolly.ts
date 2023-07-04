import crypto from 'crypto';
import { Chunk } from '.';

export class QuillTree  {
    root: Pnode<Chunk>
    // each line computes a hash of the chunks in the line.
    hash: string[] = []

    apply(p: QuillDelta) {

    }
}

// build a quill delta.

interface Pnode<T> {
  hash: string; // hash of the value?
  value?: T;
  children: Pnode<T>[];
}

function rehash<T>(node: Pnode<T>): Pnode<T> {
    const hash = crypto.createHash('sha256');
    hash.update(node.hash);

    for (const child of node.children) {
      hash.update(child.hash);
    }

    const newHash = hash.digest('hex');
    return { hash: newHash, value: node.value, children: node.children };
  }

  function diff<T>(p1: ProllyTree<T>, p2: ProllyTree<T>) : QuillDelta{

  }

export class ProllyTree<T> {
  private root: Pnode<T>;

  constructor() {
    this.root = { hash: '', children: [] };
  }

  add(value: T): void {
    const newNode: Pnode<T> = { hash: '', value, children: [] };
    const newRoot: Pnode<T> = this.addRecursive(this.root, newNode);
    this.root = newRoot;
  }

  private addRecursive(node: Pnode<T>, newNode: Pnode<T>): Pnode<T> {
    if (node.children.length === 0) {
      node.children.push(newNode);
      return this.rehash(node);
    }

    const lastChild = node.children[node.children.length - 1];
    const newLastChild = this.addRecursive(lastChild, newNode);

    if (lastChild === newLastChild) {
      return node;
    }

    node.children[node.children.length - 1] = newLastChild;
    return this.rehash(node);
  }

  private rehash(node: Pnode<T>): Pnode<T> {
    const hash = crypto.createHash('sha256');
    hash.update(node.hash);

    for (const child of node.children) {
      hash.update(child.hash);
    }

    const newHash = hash.digest('hex');
    return { hash: newHash, value: node.value, children: node.children };
  }

  get(index: number): T | undefined {
    const node = this.getRecursive(this.root, index);
    return node ? node.value : undefined;
  }

  private getRecursive(node: Pnode<T>, index: number): Pnode<T> | undefined {
    if (index === 0) {
      return node;
    }

    let i = 0;

    for (const child of node.children) {
      if (index <= i + child.children.length) {
        return this.getRecursive(child, index - i - 1);
      }

      i += child.children.length + 1;
    }

    return undefined;
  }

  get length(): number {
    return this.getLengthRecursive(this.root);
  }

  private getLengthRecursive(node: Pnode<T>): number {
    let length = node.children.length;

    for (const child of node.children) {
      length += this.getLengthRecursive(child);
    }

    return length;
  }
}