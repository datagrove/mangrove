interface Interval {
    from: number;
    to: number;
  }
  
  interface Tr<T> {
    interval: Interval;
    max: number;
    left: Branch<T>;
    right: Branch<T>;
    weight: number;
    value: T;
  }
  type Branch<T> = Tr<T> | null;

  class WeightBalancedIntervalTree<T> {
    private root: Branch<T> = null;
  
    private static weight(node: Tr<any> | null): number {
      return node ? node.weight : 0;
    }
  
    private static max(node: Tr<any> | null): number {
      return node ? node.max : -Infinity;
    }
  
    private static update(node: Tr<any>): void {
      node.max = Math.max(
        node.interval.to,
        WeightBalancedIntervalTree.max(node.left),
        WeightBalancedIntervalTree.max(node.right)
      );
      node.weight = WeightBalancedIntervalTree.weight(node.left) + WeightBalancedIntervalTree.weight(node.right) + 1;
    }
  
    private static rotateLeft<T>(node: Tr<T>): Tr<T> {
      const right = node.right!;
      node.right = right.left;
      right.left = node;
      WeightBalancedIntervalTree.update(node);
      WeightBalancedIntervalTree.update(right);
      return right;
    }
  
    private static rotateRight<T>(node: Tr<T>): Tr<T> {
      const left = node.left!;
      node.left = left.right;
      left.right = node;
      WeightBalancedIntervalTree.update(node);
      WeightBalancedIntervalTree.update(left);
      return left;
    }
  
    private static balance<T>(node: Tr<T>): Tr<T> {
      if (WeightBalancedIntervalTree.weight(node.left) > 2 * WeightBalancedIntervalTree.weight(node.right) + 1) {
        if (WeightBalancedIntervalTree.weight(node.left!.left) < WeightBalancedIntervalTree.weight(node.left!.right)) {
          node.left = WeightBalancedIntervalTree.rotateLeft(node.left!);
        }
        node = WeightBalancedIntervalTree.rotateRight(node);
      } else if (WeightBalancedIntervalTree.weight(node.right) > 2 * WeightBalancedIntervalTree.weight(node.left) + 1) {
        if (WeightBalancedIntervalTree.weight(node.right!.right) < WeightBalancedIntervalTree.weight(node.right!.left)) {
          node.right = WeightBalancedIntervalTree.rotateRight(node.right!);
        }
        node = WeightBalancedIntervalTree.rotateLeft(node);
      }
      return node;
    }
  
    private static insert<T>(node: Branch<T>, interval: Interval, value: T): Tr<T> {
      if (!node) {
        return { interval, max: interval.to, left: null, right: null, weight: 1, value };
      }
      if (interval.from < node.interval.from) {
        node.left = WeightBalancedIntervalTree.insert(node.left, interval, value);
      } else {
        node.right = WeightBalancedIntervalTree.insert(node.right, interval, value);
      }
      WeightBalancedIntervalTree.update(node);
      return WeightBalancedIntervalTree.balance(node);
    }
  
    private static search<T>(node: Branch<T>, interval: Interval): T[] {
      if (!node) {
        return [];
      }
      if (interval.to < node.interval.from) {
        return WeightBalancedIntervalTree.search(node.left, interval);
      }
      if (interval.from > node.interval.to) {
        return WeightBalancedIntervalTree.search(node.right, interval);
      }
      return [
        ...WeightBalancedIntervalTree.search(node.left, interval),
        node.value,
        ...WeightBalancedIntervalTree.search(node.right, interval),
      ];
    }
  
    insert(interval: Interval, value: T): void {
      this.root = WeightBalancedIntervalTree.insert(this.root, interval, value);
    }
  
    search(interval: Interval): T[] {
      return WeightBalancedIntervalTree.search(this.root, interval);
    }
  }