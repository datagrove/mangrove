

export class IntervalTree<T> {
  private root: Node<T> | null = null;

  add(from: Uint8Array, to: Uint8Array, listener: T) {
    const node = new Node<T>(from, to, listener);
    this.root = insert(this.root, node);
  }

  remove(from: Uint8Array, to: Uint8Array, listener: T) {
    const node = new Node(from, to, listener);
    this.root = remove(this.root, node);
  }

  stab(key: Uint8Array): T[] {
    const result: T[] = [];
    stab(this.root, key, result);
    return result;
  }
}

class Node<T> {
  constructor(
    public from: Uint8Array,
    public to: Uint8Array,
    public listener: T,
    public max: Uint8Array = to
  ) {}
  left: Node<T> | null = null;
  right: Node<T> | null = null;
}

function insert<T>(root: Node<T> | null, node: Node<T>): Node<T> {
  if (!root) {
    return node;
  }
  if (compare(node.from, root.from)) {
    root.left = insert(root.left, node);
  } else {
    root.right = insert(root.right, node);
  }
  if (compare(root.max, node.max)) {
    root.max = node.max;
  }
  return root;
}

function remove<T>(root: Node<T> | null, node: Node<T>): Node<T> | null {
  if (!root) {
    return null;
  }
  if (compare(node.from, root.from)) {
    root.left = remove(root.left, node);
  } else if (compare(root.from, node.from)) {
    root.right = remove(root.right, node);
  } else if (compare(node.to, root.to)) {
    root.left = remove(root.left, node);
  } else if (compare(root.to, node.to)) {
    root.right = remove(root.right, node);
  } else {
    if (!root.left && !root.right) {
      return null;
    }
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
    root.right = remove(root.right, min);
  }
  if (root) {
    root.max = max(root.to, max(getMax(root.left), getMax(root.right)));
  }
  return root;
}

function stab<T>(root: Node<T> | null, key: Uint8Array, result: T[]) {
  if (!root) {
    return;
  }
  if (compare(root.from, key) && compare(key, root.to)) {
    result.push(root.listener);
  }
  if (root.left && compare(root.left.max, key)) {
    stab(root.left, key, result);
  }
  if (root.right && compare(key, root.right.from)) {
    stab(root.right, key, result);
  }
}

function findMin<T>(root: Node<T>): Node<T> {
  while (root.left) {
    root = root.left;
  }
  return root;
}

function getMax<T>(root: Node<T> | null): Uint8Array {
  return root ? root.max : new Uint8Array([]);
}

// less than or equal
// maybe we should use uint32array instead? faster
function compare(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    throw new Error('Keys must have the same length');
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] < b[i]) {
      return true;
    } else if (a[i] > b[i]) {
      return false;
    }
  }
  return false;
}

function max(a: Uint8Array, b: Uint8Array): Uint8Array {
  return compare(a, b) ? b : a;
}