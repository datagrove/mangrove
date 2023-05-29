navigator.serviceWorker.register("/sw.js");

async function doFetch() {
let a = await fetch("/test")
let b = await a.text()
    console.log("Response:", b);
}
