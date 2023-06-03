

interface ScanDiff {
    tuple: Keyed[];
    copy: { which: number; start: number; end: number }[];
    size: number;
  }

  interface Keyed {
    _key: string;
  }
  
  function computeDiff(old: Keyed[], newer: Keyed[]): ScanDiff {
    const compare = (a: string, b: string) => a.localeCompare(b);
    let d: ScanDiff = {
      tuple: [],
      copy: [],
      size: 0,
    };
    let i = 0;
    let j = 0;
    while (i < old.length && j < newer.length) {
      const c = compare(old[i]._key, newer[j]._key);
      if (c < 0) {
        const k = i++;
        while (i < old.length && compare(old[i]._key, newer[j]._key) < 0) i++;
        d.copy.push({ which: 0, start: k, end: i });
      } else if (c > 0) {
        const k = i++;
        let st = d.tuple.length;
        while (j < newer.length && compare(old[i]._key, newer[j]._key) > 0) {
          d.tuple.push(newer[j++]);
          d.copy.push({ which: 1, start: j, end: j + 1 });
        }
        d.copy.push({ which: 1, start: j, end: i });
      } else {
        d.copy.push({ which: 1, start: j, end: j + 1 });
        d.tuple.push(newer[j++]);
        i++;
      }
    }
    while (j < newer.length) {
      d.tuple.push(newer[j++]);
      d.copy.push({ which: 1, start: j, end: j + 1 });
    }
    while (i < old.length) {
      d.copy.push({ which: 0, start: i, end: i + 1 });
      i++;
    }
    d.size = d.tuple.length + d.copy.length;
    return d;
  }

  function applyDiff(old: Keyed[], diff: ScanDiff): Keyed[] {
    const result: Keyed[] = [];
    let i = 0;
    let j = 0;
    for (const op of diff.copy) {
      if (op.which === 0) {
        for (let k = op.start; k < op.end; k++) {
          result.push(old[k]);
        }
      } else {
        for (let k = op.start; k < op.end; k++) {
          result.push(diff.tuple[j++]);
        }
      }
    }
    return result;
  }