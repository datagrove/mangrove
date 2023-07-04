import crypto from 'crypto';

interface MerkleNode<T> {
  hash: string;
  count: number;
  left?: MerkleNode<T>;
  right?: MerkleNode<T>;
  data?: T;
}

export class MerkleTree<T> {
  root?: MerkleNode<T>;

  constructor(data: T[], hashFn: (data: T) => string) {
    this.root = this.buildTree(data, hashFn);
  }

  private buildTree(data: T[], hashFn: (data: T) => string): MerkleNode<T> {
    if (data.length === 1) {
      return { hash: hashFn(data[0]), count: 1, data: data[0] };
    }

    const mid = Math.floor(data.length / 2);
    const left = this.buildTree(data.slice(0, mid), hashFn);
    const right = this.buildTree(data.slice(mid), hashFn);
    const hash = this.hash(left.hash + right.hash);
    const count = left.count + right.count;

    return { hash, count, left, right };
  }

  private hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  getRootHash(): string {
    if (!this.root) {
      throw new Error('Merkle tree is empty');
    }
    return this.root.hash;
  }

  getProof(data: T, hashFn: (data: T) => string): string[] {
    const proof: string[] = [];
    let node = this.root;

    while (node && node.left && node.right) {
      if (hashFn(data) < node.left.hash) {
        proof.push(node.right.hash);
        node = node.left;
      } else {
        proof.push(node.left.hash);
        node = node.right;
      }
    }

    return proof;
  }

  verify(data: T, proof: string[], hashFn: (data: T) => string): boolean {
    let hash = hashFn(data);

    for (const siblingHash of proof) {
      if (hash < siblingHash) {
        hash = this.hash(hash + siblingHash);
      } else {
        hash = this.hash(siblingHash + hash);
      }
    }

    return hash === this.getRootHash();
  }

  countIdenticalItems(hashFn: (data: T) => string): number {
    if (!this.root) {
      return 0;
    }

    let count = 0;
    let node = this.root;

    while (node && node.left && node.right) {
      if (node.left.count === node.right.count) {
        count += node.left.count;
        node = node.left;
      } else {
        break;
      }
    }

    return count;
  }
}