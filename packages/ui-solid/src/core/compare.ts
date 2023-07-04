export function compare(a: Uint8Array, b: Uint8Array): number {
    for (let i = 0; i < Math.min(b.length,a.length); i++) {
      if (a[i] < b[i]) {
        return -1;
      } else if (a[i] > b[i]) {
        return 1;
      }
    }
    return a.length - b.length;
  }