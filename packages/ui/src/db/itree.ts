class Node<T> {
    from: string;
    to: string;
    max: string;
    listener: T;
    left: Node<T> | null;
    right: Node<T> | null;
  
    constructor(from: string, to: string, listener: T) {
      this.from = from;
      this.to = to;
      this.max = to;
      this.listener = listener;
      this.left = null;
      this.right = null;
    }
  }
  
  export class IntervalTree<T> {
    private root: Node<T> | null;
  
    constructor() {
      this.root = null;
    }
  
    add(from: string, to: string, listener: T) {
      this.root = insert(this.root, from, to, listener);
    }
  
    remove(from: string, to: string, listener: T) {
      this.root = remove(this.root, from, to, listener);
    }
  
    stab(key: string): T[] {
      const result: T[] = [];
      stabHelper(this.root, key, result);
      return result;
    }
  }
  
  function insert<T>(root: Node<T> | null, from: string, to: string, listener: T): Node<T> {
    if (!root) {
      return new Node(from, to, listener);
    }
    if (from < root.from) {
      root.left = insert(root.left, from, to, listener);
    } else {
      root.right = insert(root.right, from, to, listener);
    }
    if (root) {
      root.max = max(root.to, max(getMax(root.left), getMax(root.right)));
    }
    return root;
  }
  
  function remove<T>(root: Node<T> | null, from: string, to: string, listener: T): Node<T> | null {
    if (!root) {
      return null;
    }
    if (from < root.from) {
      root.left = remove(root.left, from, to, listener);
    } else if (from > root.from) {
      root.right = remove(root.right, from, to, listener);
    } else if (to < root.to) {
      root.left = remove(root.left, from, to, listener);
    } else if (to > root.to) {
      root.right = remove(root.right, from, to, listener);
    } else if (root.listener !== listener) {
      root.left = remove(root.left, from, to, listener);
      root.right = remove(root.right, from, to, listener);
    } else {
      if (!root.left) {
        return root.right;
      }
      if (!root.right) {
        return root.left;
      }
      const min = findMin(root.right);
      root.from = min.from;
      root.to = min.to;
      root.listener = min.listener;
      root.right = remove(root.right, min.from, min.to, min.listener);
    }
    if (root) {
      root.max = max(root.to, max(getMax(root.left), getMax(root.right)));
    }
    return root;
  }
  
  function stabHelper<T>(root: Node<T> | null, key: string, result: T[]) {
    if (!root) {
      return;
    }
    if (root.from <= key && key <= root.to) {
      result.push(root.listener);
    }
    if (root.left && root.left.max >= key) {
      stabHelper(root.left, key, result);
    }
    if (root.right && root.right.from <= key) {
      stabHelper(root.right, key, result);
    }
  }
  
  function findMin<T>(root: Node<T>): Node<T> {
    while (root.left) {
      root = root.left;
    }
    return root;
  }
  
  function getMax<T>(root: Node<T> | null): string {
    return root ? root.max : "";
  }
  
  function max(a: string, b: string): string {
    return a > b ? a : b;
  }