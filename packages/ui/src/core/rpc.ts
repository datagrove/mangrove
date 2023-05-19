export function debounce<F extends (...params: any[]) => void>(
    fn: F,
    delay: number
) {
    let timeoutID: number | undefined;
    return function (this: any, ...args: any[]) {
        clearTimeout(timeoutID);
        timeoutID = window.setTimeout(() => fn.apply(this, args), delay);
    } as F;
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));