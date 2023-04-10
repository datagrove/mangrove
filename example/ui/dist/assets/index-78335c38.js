(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))r(s);new MutationObserver(s=>{for(const i of s)if(i.type==="childList")for(const l of i.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&r(l)}).observe(document,{childList:!0,subtree:!0});function n(s){const i={};return s.integrity&&(i.integrity=s.integrity),s.referrerPolicy&&(i.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?i.credentials="include":s.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function r(s){if(s.ep)return;s.ep=!0;const i=n(s);fetch(s.href,i)}})();const Ye=(e,t)=>e===t,Z=Symbol("solid-proxy"),Ze=Symbol("solid-track"),ee={equals:Ye};let Oe=_e;const I=1,te=2,Re={owned:null,cleanups:null,context:null,owner:null};var w=null;let ue=null,m=null,S=null,N=null,ie=0;function H(e,t){const n=m,r=w,s=e.length===0,i=s?Re:{owned:null,cleanups:null,context:null,owner:t===void 0?r:t},l=s?e:()=>e(()=>O(()=>oe(i)));w=i,m=null;try{return D(l,!0)}finally{m=n,w=r}}function B(e,t){t=t?Object.assign({},ee,t):ee;const n={value:e,observers:null,observerSlots:null,comparator:t.equals||void 0},r=s=>(typeof s=="function"&&(s=s(n.value)),je(n,s));return[Te.bind(n),r]}function _(e,t,n){const r=be(e,t,!1,I);X(r)}function et(e,t,n){Oe=lt;const r=be(e,t,!1,I);r.user=!0,N?N.push(r):X(r)}function A(e,t,n){n=n?Object.assign({},ee,n):ee;const r=be(e,t,!0,0);return r.observers=null,r.observerSlots=null,r.comparator=n.equals||void 0,X(r),Te.bind(r)}function O(e){if(m===null)return e();const t=m;m=null;try{return e()}finally{m=t}}function Ne(e,t,n){const r=Array.isArray(e);let s,i=n&&n.defer;return l=>{let o;if(r){o=Array(e.length);for(let a=0;a<e.length;a++)o[a]=e[a]()}else o=e();if(i){i=!1;return}const u=O(()=>t(o,s,l));return s=o,u}}function tt(e){et(()=>O(e))}function me(e){return w===null||(w.cleanups===null?w.cleanups=[e]:w.cleanups.push(e)),e}function nt(){return w}function rt(e,t){const n=w,r=m;w=e,m=null;try{return D(t,!0)}catch(s){Ae(s)}finally{w=n,m=r}}function st(e){const t=m,n=w;return Promise.resolve().then(()=>{m=t,w=n;let r;return D(e,!1),m=w=null,r?r.done:void 0})}function ke(e,t){const n=Symbol("context");return{id:n,Provider:ct(n),defaultValue:e}}function we(e){let t;return(t=Be(w,e.id))!==void 0?t:e.defaultValue}function pe(e){const t=A(e),n=A(()=>he(t()));return n.toArray=()=>{const r=n();return Array.isArray(r)?r:r!=null?[r]:[]},n}function Te(){if(this.sources&&this.state)if(this.state===I)X(this);else{const e=S;S=null,D(()=>re(this),!1),S=e}if(m){const e=this.observers?this.observers.length:0;m.sources?(m.sources.push(this),m.sourceSlots.push(e)):(m.sources=[this],m.sourceSlots=[e]),this.observers?(this.observers.push(m),this.observerSlots.push(m.sources.length-1)):(this.observers=[m],this.observerSlots=[m.sources.length-1])}return this.value}function je(e,t,n){let r=e.value;return(!e.comparator||!e.comparator(r,t))&&(e.value=t,e.observers&&e.observers.length&&D(()=>{for(let s=0;s<e.observers.length;s+=1){const i=e.observers[s],l=ue&&ue.running;l&&ue.disposed.has(i),(l?!i.tState:!i.state)&&(i.pure?S.push(i):N.push(i),i.observers&&Ie(i)),l||(i.state=I)}if(S.length>1e6)throw S=[],new Error},!1)),t}function X(e){if(!e.fn)return;oe(e);const t=w,n=m,r=ie;m=w=e,it(e,e.value,r),m=n,w=t}function it(e,t,n){let r;try{r=e.fn(t)}catch(s){return e.pure&&(e.state=I,e.owned&&e.owned.forEach(oe),e.owned=null),e.updatedAt=n+1,Ae(s)}(!e.updatedAt||e.updatedAt<=n)&&(e.updatedAt!=null&&"observers"in e?je(e,r):e.value=r,e.updatedAt=n)}function be(e,t,n,r=I,s){const i={fn:e,state:r,updatedAt:null,owned:null,sources:null,sourceSlots:null,cleanups:null,value:t,owner:w,context:null,pure:n};return w===null||w!==Re&&(w.owned?w.owned.push(i):w.owned=[i]),i}function ne(e){if(e.state===0)return;if(e.state===te)return re(e);if(e.suspense&&O(e.suspense.inFallback))return e.suspense.effects.push(e);const t=[e];for(;(e=e.owner)&&(!e.updatedAt||e.updatedAt<ie);)e.state&&t.push(e);for(let n=t.length-1;n>=0;n--)if(e=t[n],e.state===I)X(e);else if(e.state===te){const r=S;S=null,D(()=>re(e,t[0]),!1),S=r}}function D(e,t){if(S)return e();let n=!1;t||(S=[]),N?n=!0:N=[],ie++;try{const r=e();return ot(n),r}catch(r){n||(N=null),S=null,Ae(r)}}function ot(e){if(S&&(_e(S),S=null),e)return;const t=N;N=null,t.length&&D(()=>Oe(t),!1)}function _e(e){for(let t=0;t<e.length;t++)ne(e[t])}function lt(e){let t,n=0;for(t=0;t<e.length;t++){const r=e[t];r.user?e[n++]=r:ne(r)}for(t=0;t<n;t++)ne(e[t])}function re(e,t){e.state=0;for(let n=0;n<e.sources.length;n+=1){const r=e.sources[n];if(r.sources){const s=r.state;s===I?r!==t&&(!r.updatedAt||r.updatedAt<ie)&&ne(r):s===te&&re(r,t)}}}function Ie(e){for(let t=0;t<e.observers.length;t+=1){const n=e.observers[t];n.state||(n.state=te,n.pure?S.push(n):N.push(n),n.observers&&Ie(n))}}function oe(e){let t;if(e.sources)for(;e.sources.length;){const n=e.sources.pop(),r=e.sourceSlots.pop(),s=n.observers;if(s&&s.length){const i=s.pop(),l=n.observerSlots.pop();r<s.length&&(i.sourceSlots[l]=r,s[r]=i,n.observerSlots[r]=l)}}if(e.owned){for(t=e.owned.length-1;t>=0;t--)oe(e.owned[t]);e.owned=null}if(e.cleanups){for(t=e.cleanups.length-1;t>=0;t--)e.cleanups[t]();e.cleanups=null}e.state=0,e.context=null}function Ae(e){throw e}function Be(e,t){return e?e.context&&e.context[t]!==void 0?e.context[t]:Be(e.owner,t):void 0}function he(e){if(typeof e=="function"&&!e.length)return he(e());if(Array.isArray(e)){const t=[];for(let n=0;n<e.length;n++){const r=he(e[n]);Array.isArray(r)?t.push.apply(t,r):t.push(r)}return t}return e}function ct(e,t){return function(r){let s;return _(()=>s=O(()=>(w.context={[e]:r.value},pe(()=>r.children))),void 0),s}}const ut=Symbol("fallback");function ve(e){for(let t=0;t<e.length;t++)e[t]()}function at(e,t,n={}){let r=[],s=[],i=[],l=0,o=t.length>1?[]:null;return me(()=>ve(i)),()=>{let u=e()||[],a,c;return u[Ze],O(()=>{let f=u.length,g,b,d,L,R,v,C,$,E;if(f===0)l!==0&&(ve(i),i=[],r=[],s=[],l=0,o&&(o=[])),n.fallback&&(r=[ut],s[0]=H(J=>(i[0]=J,n.fallback())),l=1);else if(l===0){for(s=new Array(f),c=0;c<f;c++)r[c]=u[c],s[c]=H(h);l=f}else{for(d=new Array(f),L=new Array(f),o&&(R=new Array(f)),v=0,C=Math.min(l,f);v<C&&r[v]===u[v];v++);for(C=l-1,$=f-1;C>=v&&$>=v&&r[C]===u[$];C--,$--)d[$]=s[C],L[$]=i[C],o&&(R[$]=o[C]);for(g=new Map,b=new Array($+1),c=$;c>=v;c--)E=u[c],a=g.get(E),b[c]=a===void 0?-1:a,g.set(E,c);for(a=v;a<=C;a++)E=r[a],c=g.get(E),c!==void 0&&c!==-1?(d[c]=s[a],L[c]=i[a],o&&(R[c]=o[a]),c=b[c],g.set(E,c)):i[a]();for(c=v;c<f;c++)c in d?(s[c]=d[c],i[c]=L[c],o&&(o[c]=R[c],o[c](c))):s[c]=H(h);s=s.slice(0,l=f),r=u.slice(0)}return s});function h(f){if(i[c]=f,o){const[g,b]=B(c);return o[c]=b,t(u[c],g)}return t(u[c])}}}function x(e,t){return O(()=>e(t||{}))}function Q(){return!0}const de={get(e,t,n){return t===Z?n:e.get(t)},has(e,t){return t===Z?!0:e.has(t)},set:Q,deleteProperty:Q,getOwnPropertyDescriptor(e,t){return{configurable:!0,enumerable:!0,get(){return e.get(t)},set:Q,deleteProperty:Q}},ownKeys(e){return e.keys()}};function ae(e){return(e=typeof e=="function"?e():e)?e:{}}function se(...e){let t=!1;for(let r=0;r<e.length;r++){const s=e[r];t=t||!!s&&Z in s,e[r]=typeof s=="function"?(t=!0,A(s)):s}if(t)return new Proxy({get(r){for(let s=e.length-1;s>=0;s--){const i=ae(e[s])[r];if(i!==void 0)return i}},has(r){for(let s=e.length-1;s>=0;s--)if(r in ae(e[s]))return!0;return!1},keys(){const r=[];for(let s=0;s<e.length;s++)r.push(...Object.keys(ae(e[s])));return[...new Set(r)]}},de);const n={};for(let r=e.length-1;r>=0;r--)if(e[r]){const s=Object.getOwnPropertyDescriptors(e[r]);for(const i in s)i in n||Object.defineProperty(n,i,{enumerable:!0,get(){for(let l=e.length-1;l>=0;l--){const o=(e[l]||{})[i];if(o!==void 0)return o}}})}return n}function Me(e,...t){const n=new Set(t.flat());if(Z in e){const s=t.map(i=>new Proxy({get(l){return i.includes(l)?e[l]:void 0},has(l){return i.includes(l)&&l in e},keys(){return i.filter(l=>l in e)}},de));return s.push(new Proxy({get(i){return n.has(i)?void 0:e[i]},has(i){return n.has(i)?!1:i in e},keys(){return Object.keys(e).filter(i=>!n.has(i))}},de)),s}const r=Object.getOwnPropertyDescriptors(e);return t.push(Object.keys(r).filter(s=>!n.has(s))),t.map(s=>{const i={};for(let l=0;l<s.length;l++){const o=s[l];o in e&&Object.defineProperty(i,o,r[o]?r[o]:{get(){return e[o]},set(){return!0},enumerable:!0})}return i})}const ft=e=>`Stale read from <${e}>.`;function ht(e){const t="fallback"in e&&{fallback:()=>e.fallback};return A(at(()=>e.each,e.children,t||void 0))}function xe(e){const t=e.keyed,n=A(()=>e.when,void 0,{equals:(r,s)=>t?r===s:!r==!s});return A(()=>{const r=n();if(r){const s=e.children;return typeof s=="function"&&s.length>0?O(()=>s(t?r:()=>{if(!O(n))throw ft("Show");return e.when})):s}return e.fallback},void 0,void 0)}const dt=["allowfullscreen","async","autofocus","autoplay","checked","controls","default","disabled","formnovalidate","hidden","indeterminate","ismap","loop","multiple","muted","nomodule","novalidate","open","playsinline","readonly","required","reversed","seamless","selected"],gt=new Set(["className","value","readOnly","formNoValidate","isMap","noModule","playsInline",...dt]),yt=new Set(["innerHTML","textContent","innerText","children"]),mt=Object.assign(Object.create(null),{className:"class",htmlFor:"for"}),wt=Object.assign(Object.create(null),{class:"className",formnovalidate:{$:"formNoValidate",BUTTON:1,INPUT:1},ismap:{$:"isMap",IMG:1},nomodule:{$:"noModule",SCRIPT:1},playsinline:{$:"playsInline",VIDEO:1},readonly:{$:"readOnly",INPUT:1,TEXTAREA:1}});function pt(e,t){const n=wt[e];return typeof n=="object"?n[t]?n.$:void 0:n}const bt=new Set(["beforeinput","click","dblclick","contextmenu","focusin","focusout","input","keydown","keyup","mousedown","mousemove","mouseout","mouseover","mouseup","pointerdown","pointermove","pointerout","pointerover","pointerup","touchend","touchmove","touchstart"]),At={xlink:"http://www.w3.org/1999/xlink",xml:"http://www.w3.org/XML/1998/namespace"};function xt(e,t,n){let r=n.length,s=t.length,i=r,l=0,o=0,u=t[s-1].nextSibling,a=null;for(;l<s||o<i;){if(t[l]===n[o]){l++,o++;continue}for(;t[s-1]===n[i-1];)s--,i--;if(s===l){const c=i<r?o?n[o-1].nextSibling:n[i-o]:u;for(;o<i;)e.insertBefore(n[o++],c)}else if(i===o)for(;l<s;)(!a||!a.has(t[l]))&&t[l].remove(),l++;else if(t[l]===n[i-1]&&n[o]===t[s-1]){const c=t[--s].nextSibling;e.insertBefore(n[o++],t[l++].nextSibling),e.insertBefore(n[--i],c),t[s]=n[i]}else{if(!a){a=new Map;let h=o;for(;h<i;)a.set(n[h],h++)}const c=a.get(t[l]);if(c!=null)if(o<c&&c<i){let h=l,f=1,g;for(;++h<s&&h<i&&!((g=a.get(t[h]))==null||g!==c+f);)f++;if(f>c-o){const b=t[l];for(;o<c;)e.insertBefore(n[o++],b)}else e.replaceChild(n[o++],t[l++])}else l++;else t[l++].remove()}}}const Ce="_$DX_DELEGATE";function Pt(e,t,n,r={}){let s;return H(i=>{s=i,t===document?e():U(t,e(),t.firstChild?null:void 0,n)},r.owner),()=>{s(),t.textContent=""}}function k(e,t,n){let r;const s=()=>{const l=document.createElement("template");return l.innerHTML=e,n?l.content.firstChild.firstChild:l.content.firstChild},i=t?()=>(r||(r=s())).cloneNode(!0):()=>O(()=>document.importNode(r||(r=s()),!0));return i.cloneNode=i,i}function Ue(e,t=window.document){const n=t[Ce]||(t[Ce]=new Set);for(let r=0,s=e.length;r<s;r++){const i=e[r];n.has(i)||(n.add(i),t.addEventListener(i,Rt))}}function ge(e,t,n){n==null?e.removeAttribute(t):e.setAttribute(t,n)}function St(e,t,n,r){r==null?e.removeAttributeNS(t,n):e.setAttributeNS(t,n,r)}function vt(e,t){t==null?e.removeAttribute("class"):e.className=t}function Ct(e,t,n,r){if(r)Array.isArray(n)?(e[`$$${t}`]=n[0],e[`$$${t}Data`]=n[1]):e[`$$${t}`]=n;else if(Array.isArray(n)){const s=n[0];e.addEventListener(t,n[0]=i=>s.call(e,n[1],i))}else e.addEventListener(t,n)}function $t(e,t,n={}){const r=Object.keys(t||{}),s=Object.keys(n);let i,l;for(i=0,l=s.length;i<l;i++){const o=s[i];!o||o==="undefined"||t[o]||($e(e,o,!1),delete n[o])}for(i=0,l=r.length;i<l;i++){const o=r[i],u=!!t[o];!o||o==="undefined"||n[o]===u||!u||($e(e,o,!0),n[o]=u)}return n}function Et(e,t,n){if(!t)return n?ge(e,"style"):t;const r=e.style;if(typeof t=="string")return r.cssText=t;typeof n=="string"&&(r.cssText=n=void 0),n||(n={}),t||(t={});let s,i;for(i in n)t[i]==null&&r.removeProperty(i),delete n[i];for(i in t)s=t[i],s!==n[i]&&(r.setProperty(i,s),n[i]=s);return n}function De(e,t={},n,r){const s={};return r||_(()=>s.children=q(e,t.children,s.children)),_(()=>t.ref&&t.ref(e)),_(()=>Lt(e,t,n,!0,s,!0)),s}function U(e,t,n,r){if(n!==void 0&&!r&&(r=[]),typeof t!="function")return q(e,t,r,n);_(s=>q(e,t(),s,n),r)}function Lt(e,t,n,r,s={},i=!1){t||(t={});for(const l in s)if(!(l in t)){if(l==="children")continue;s[l]=Ee(e,l,null,s[l],n,i)}for(const l in t){if(l==="children"){r||q(e,t.children);continue}const o=t[l];s[l]=Ee(e,l,o,s[l],n,i)}}function Ot(e){return e.toLowerCase().replace(/-([a-z])/g,(t,n)=>n.toUpperCase())}function $e(e,t,n){const r=t.trim().split(/\s+/);for(let s=0,i=r.length;s<i;s++)e.classList.toggle(r[s],n)}function Ee(e,t,n,r,s,i){let l,o,u,a,c;if(t==="style")return Et(e,n,r);if(t==="classList")return $t(e,n,r);if(n===r)return r;if(t==="ref")i||n(e);else if(t.slice(0,3)==="on:"){const h=t.slice(3);r&&e.removeEventListener(h,r),n&&e.addEventListener(h,n)}else if(t.slice(0,10)==="oncapture:"){const h=t.slice(10);r&&e.removeEventListener(h,r,!0),n&&e.addEventListener(h,n,!0)}else if(t.slice(0,2)==="on"){const h=t.slice(2).toLowerCase(),f=bt.has(h);if(!f&&r){const g=Array.isArray(r)?r[0]:r;e.removeEventListener(h,g)}(f||n)&&(Ct(e,h,n,f),f&&Ue([h]))}else if(t.slice(0,5)==="attr:")ge(e,t.slice(5),n);else if((c=t.slice(0,5)==="prop:")||(u=yt.has(t))||!s&&((a=pt(t,e.tagName))||(o=gt.has(t)))||(l=e.nodeName.includes("-")))c&&(t=t.slice(5),o=!0),t==="class"||t==="className"?vt(e,n):l&&!o&&!u?e[Ot(t)]=n:e[a||t]=n;else{const h=s&&t.indexOf(":")>-1&&At[t.split(":")[0]];h?St(e,h,t,n):ge(e,mt[t]||t,n)}return n}function Rt(e){const t=`$$${e.type}`;let n=e.composedPath&&e.composedPath()[0]||e.target;for(e.target!==n&&Object.defineProperty(e,"target",{configurable:!0,value:n}),Object.defineProperty(e,"currentTarget",{configurable:!0,get(){return n||document}});n;){const r=n[t];if(r&&!n.disabled){const s=n[`${t}Data`];if(s!==void 0?r.call(n,s,e):r.call(n,e),e.cancelBubble)return}n=n._$host||n.parentNode||n.host}}function q(e,t,n,r,s){for(;typeof n=="function";)n=n();if(t===n)return n;const i=typeof t,l=r!==void 0;if(e=l&&n[0]&&n[0].parentNode||e,i==="string"||i==="number")if(i==="number"&&(t=t.toString()),l){let o=n[0];o&&o.nodeType===3?o.data=t:o=document.createTextNode(t),n=K(e,n,r,o)}else n!==""&&typeof n=="string"?n=e.firstChild.data=t:n=e.textContent=t;else if(t==null||i==="boolean")n=K(e,n,r);else{if(i==="function")return _(()=>{let o=t();for(;typeof o=="function";)o=o();n=q(e,o,n,r)}),()=>n;if(Array.isArray(t)){const o=[],u=n&&Array.isArray(n);if(ye(o,t,n,s))return _(()=>n=q(e,o,n,r,!0)),()=>n;if(o.length===0){if(n=K(e,n,r),l)return n}else u?n.length===0?Le(e,o,r):xt(e,n,o):(n&&K(e),Le(e,o));n=o}else if(t instanceof Node){if(Array.isArray(n)){if(l)return n=K(e,n,r,t);K(e,n,null,t)}else n==null||n===""||!e.firstChild?e.appendChild(t):e.replaceChild(t,e.firstChild);n=t}else console.warn("Unrecognized value. Skipped inserting",t)}return n}function ye(e,t,n,r){let s=!1;for(let i=0,l=t.length;i<l;i++){let o=t[i],u=n&&n[i];if(o instanceof Node)e.push(o);else if(!(o==null||o===!0||o===!1))if(Array.isArray(o))s=ye(e,o,u)||s;else if(typeof o=="function")if(r){for(;typeof o=="function";)o=o();s=ye(e,Array.isArray(o)?o:[o],Array.isArray(u)?u:[u])||s}else e.push(o),s=!0;else{const a=String(o);u&&u.nodeType===3?(u.data=a,e.push(u)):e.push(document.createTextNode(a))}}return s}function Le(e,t,n=null){for(let r=0,s=t.length;r<s;r++)e.insertBefore(t[r],n)}function K(e,t,n,r){if(n===void 0)return e.textContent="";const s=r||document.createTextNode("");if(t.length){let i=!1;for(let l=t.length-1;l>=0;l--){const o=t[l];if(s!==o){const u=o.parentNode===e;!i&&!l?u?e.replaceChild(s,o):e.insertBefore(s,n):u&&o.remove()}else i=!0}}else e.insertBefore(s,n);return[s]}const Nt=!1;function Ke(e,t,n){return e.addEventListener(t,n),()=>e.removeEventListener(t,n)}function kt([e,t],n,r){return[n?()=>n(e()):e,r?s=>t(r(s)):t]}function Tt(e){try{return document.querySelector(e)}catch{return null}}function qe(e,t){const n=Tt(`#${e}`);n?n.scrollIntoView():t&&window.scrollTo(0,0)}function Fe(e,t,n,r){let s=!1;const i=o=>typeof o=="string"?{value:o}:o,l=kt(B(i(e()),{equals:(o,u)=>o.value===u.value}),void 0,o=>(!s&&t(o),o));return n&&me(n((o=e())=>{s=!0,l[1](i(o)),s=!1})),{signal:l,utils:r}}function jt(e){if(e){if(Array.isArray(e))return{signal:e}}else return{signal:B({value:""})};return e}function _t(){return Fe(()=>({value:window.location.pathname+window.location.search+window.location.hash,state:history.state}),({value:e,replace:t,scroll:n,state:r})=>{t?window.history.replaceState(r,"",e):window.history.pushState(r,"",e),qe(window.location.hash.slice(1),n)},e=>Ke(window,"popstate",()=>e()),{go:e=>window.history.go(e)})}function It(){return Fe(()=>window.location.hash.slice(1),({value:e,replace:t,scroll:n,state:r})=>{t?window.history.replaceState(r,"","#"+e):window.location.hash=e;const s=e.indexOf("#"),i=s>=0?e.slice(s+1):"";qe(i,n)},e=>Ke(window,"hashchange",()=>e()),{go:e=>window.history.go(e),renderPath:e=>`#${e}`,parsePath:e=>{const t=e.replace(/^.*?#/,"");if(!t.startsWith("/")){const[,n="/"]=window.location.hash.split("#",2);return`${n}#${t}`}return t}})}function Bt(){let e=new Set;function t(s){return e.add(s),()=>e.delete(s)}let n=!1;function r(s,i){if(n)return!(n=!1);const l={to:s,options:i,defaultPrevented:!1,preventDefault:()=>l.defaultPrevented=!0};for(const o of e)o.listener({...l,from:o.location,retry:u=>{u&&(n=!0),o.navigate(s,i)}});return!l.defaultPrevented}return{subscribe:t,confirm:r}}const Mt=/^(?:[a-z0-9]+:)?\/\//i,Ut=/^\/+|(\/)\/+$/g;function M(e,t=!1){const n=e.replace(Ut,"$1");return n?t||/^[?#]/.test(n)?n:"/"+n:""}function Y(e,t,n){if(Mt.test(t))return;const r=M(e),s=n&&M(n);let i="";return!s||t.startsWith("/")?i=r:s.toLowerCase().indexOf(r.toLowerCase())!==0?i=r+s:i=s,(i||"/")+M(t,!i)}function Dt(e,t){if(e==null)throw new Error(t);return e}function We(e,t){return M(e).replace(/\/*(\*.*)?$/g,"")+M(t)}function Kt(e){const t={};return e.searchParams.forEach((n,r)=>{t[r]=n}),t}function qt(e,t,n){const[r,s]=e.split("/*",2),i=r.split("/").filter(Boolean),l=i.length;return o=>{const u=o.split("/").filter(Boolean),a=u.length-l;if(a<0||a>0&&s===void 0&&!t)return null;const c={path:l?"":"/",params:{}},h=f=>n===void 0?void 0:n[f];for(let f=0;f<l;f++){const g=i[f],b=u[f],d=g[0]===":",L=d?g.slice(1):g;if(d&&fe(b,h(L)))c.params[L]=b;else if(d||!fe(b,g))return null;c.path+=`/${b}`}if(s){const f=a?u.slice(-a).join("/"):"";if(fe(f,h(s)))c.params[s]=f;else return null}return c}}function fe(e,t){const n=r=>r.localeCompare(e,void 0,{sensitivity:"base"})===0;return t===void 0?!0:typeof t=="string"?n(t):typeof t=="function"?t(e):Array.isArray(t)?t.some(n):t instanceof RegExp?t.test(e):!1}function Ft(e){const[t,n]=e.pattern.split("/*",2),r=t.split("/").filter(Boolean);return r.reduce((s,i)=>s+(i.startsWith(":")?2:3),r.length-(n===void 0?0:1))}function He(e){const t=new Map,n=nt();return new Proxy({},{get(r,s){return t.has(s)||rt(n,()=>t.set(s,A(()=>e()[s]))),t.get(s)()},getOwnPropertyDescriptor(){return{enumerable:!0,configurable:!0}},ownKeys(){return Reflect.ownKeys(e())}})}function Ve(e){let t=/(\/?\:[^\/]+)\?/.exec(e);if(!t)return[e];let n=e.slice(0,t.index),r=e.slice(t.index+t[0].length);const s=[n,n+=t[1]];for(;t=/^(\/\:[^\/]+)\?/.exec(r);)s.push(n+=t[1]),r=r.slice(t[0].length);return Ve(r).reduce((i,l)=>[...i,...s.map(o=>o+l)],[])}const Wt=100,Xe=ke(),le=ke(),ce=()=>Dt(we(Xe),"Make sure your app is wrapped in a <Router />");let V;const Pe=()=>V||we(le)||ce().base,Ht=e=>{const t=Pe();return A(()=>t.resolvePath(e()))},Vt=e=>{const t=ce();return A(()=>{const n=e();return n!==void 0?t.renderPath(n):n})},Xt=()=>ce().location;function Jt(e,t="",n){const{component:r,data:s,children:i}=e,l=!i||Array.isArray(i)&&!i.length,o={key:e,element:r?()=>x(r,{}):()=>{const{element:u}=e;return u===void 0&&n?x(n,{}):u},preload:e.component?r.preload:e.preload,data:s};return Je(e.path).reduce((u,a)=>{for(const c of Ve(a)){const h=We(t,c),f=l?h:h.split("/*",1)[0];u.push({...o,originalPath:c,pattern:f,matcher:qt(f,!l,e.matchFilters)})}return u},[])}function zt(e,t=0){return{routes:e,score:Ft(e[e.length-1])*1e4-t,matcher(n){const r=[];for(let s=e.length-1;s>=0;s--){const i=e[s],l=i.matcher(n);if(!l)return null;r.unshift({...l,route:i})}return r}}}function Je(e){return Array.isArray(e)?e:[e]}function ze(e,t="",n,r=[],s=[]){const i=Je(e);for(let l=0,o=i.length;l<o;l++){const u=i[l];if(u&&typeof u=="object"&&u.hasOwnProperty("path")){const a=Jt(u,t,n);for(const c of a){r.push(c);const h=Array.isArray(u.children)&&u.children.length===0;if(u.children&&!h)ze(u.children,c.pattern,n,r,s);else{const f=zt([...r],s.length);s.push(f)}r.pop()}}}return r.length?s:s.sort((l,o)=>o.score-l.score)}function Gt(e,t){for(let n=0,r=e.length;n<r;n++){const s=e[n].matcher(t);if(s)return s}return[]}function Qt(e,t){const n=new URL("http://sar"),r=A(u=>{const a=e();try{return new URL(a,n)}catch{return console.error(`Invalid path ${a}`),u}},n,{equals:(u,a)=>u.href===a.href}),s=A(()=>r().pathname),i=A(()=>r().search,!0),l=A(()=>r().hash),o=A(()=>"");return{get pathname(){return s()},get search(){return i()},get hash(){return l()},get state(){return t()},get key(){return o()},query:He(Ne(i,()=>Kt(r())))}}function Yt(e,t="",n,r){const{signal:[s,i],utils:l={}}=jt(e),o=l.parsePath||(p=>p),u=l.renderPath||(p=>p),a=l.beforeLeave||Bt(),c=Y("",t),h=void 0;if(c===void 0)throw new Error(`${c} is not a valid base path`);c&&!s().value&&i({value:c,replace:!0,scroll:!1});const[f,g]=B(!1),b=async p=>{g(!0);try{await st(p)}finally{g(!1)}},[d,L]=B(s().value),[R,v]=B(s().state),C=Qt(d,R),$=[],E={pattern:c,params:{},path:()=>c,outlet:()=>null,resolvePath(p){return Y(c,p)}};if(n)try{V=E,E.data=n({data:void 0,params:{},location:C,navigate:Se(E)})}finally{V=void 0}function J(p,y,P){O(()=>{if(typeof y=="number"){y&&(l.go?a.confirm(y,P)&&l.go(y):console.warn("Router integration does not support relative routing"));return}const{replace:z,resolve:G,scroll:T,state:F}={replace:!1,resolve:!0,scroll:!0,...P},j=G?p.resolvePath(y):Y("",y);if(j===void 0)throw new Error(`Path '${y}' is not a routable path`);if($.length>=Wt)throw new Error("Too many redirects");const W=d();if((j!==W||F!==R())&&!Nt){if(a.confirm(j,P)){const Qe=$.push({value:W,replace:z,scroll:T,state:R()});b(()=>{L(j),v(F)}).then(()=>{$.length===Qe&&Ge({value:j,state:F})})}}})}function Se(p){return p=p||we(le)||E,(y,P)=>J(p,y,P)}function Ge(p){const y=$[0];y&&((p.value!==y.value||p.state!==y.state)&&i({...p,replace:y.replace,scroll:y.scroll}),$.length=0)}_(()=>{const{value:p,state:y}=s();O(()=>{p!==d()&&b(()=>{L(p),v(y)})})});{let p=function(y){if(y.defaultPrevented||y.button!==0||y.metaKey||y.altKey||y.ctrlKey||y.shiftKey)return;const P=y.composedPath().find(W=>W instanceof Node&&W.nodeName.toUpperCase()==="A");if(!P||!P.hasAttribute("link"))return;const z=P.href;if(P.target||!z&&!P.hasAttribute("state"))return;const G=(P.getAttribute("rel")||"").split(/\s+/);if(P.hasAttribute("download")||G&&G.includes("external"))return;const T=new URL(z);if(T.origin!==window.location.origin||c&&T.pathname&&!T.pathname.toLowerCase().startsWith(c.toLowerCase()))return;const F=o(T.pathname+T.search+T.hash),j=P.getAttribute("state");y.preventDefault(),J(E,F,{resolve:!1,replace:P.hasAttribute("replace"),scroll:!P.hasAttribute("noscroll"),state:j&&JSON.parse(j)})};var xn=p;Ue(["click"]),document.addEventListener("click",p),me(()=>document.removeEventListener("click",p))}return{base:E,out:h,location:C,isRouting:f,renderPath:u,parsePath:o,navigatorFactory:Se,beforeLeave:a}}function Zt(e,t,n,r,s){const{base:i,location:l,navigatorFactory:o}=e,{pattern:u,element:a,preload:c,data:h}=r().route,f=A(()=>r().path);c&&c();const g={parent:t,pattern:u,get child(){return n()},path:f,params:s,data:t.data,outlet:a,resolvePath(b){return Y(i.path(),b,f())}};if(h)try{V=g,g.data=h({data:t.data,params:s,location:l,navigate:o(g)})}finally{V=void 0}return g}const en=k("<a link>"),tn=e=>{const{source:t,url:n,base:r,data:s,out:i}=e,l=t||_t(),o=Yt(l,r,s);return x(Xe.Provider,{value:o,get children(){return e.children}})},nn=e=>{const t=ce(),n=Pe(),r=pe(()=>e.children),s=A(()=>ze(r(),We(n.pattern,e.base||""),sn)),i=A(()=>Gt(s(),t.location.pathname)),l=He(()=>{const c=i(),h={};for(let f=0;f<c.length;f++)Object.assign(h,c[f].params);return h});t.out&&t.out.matches.push(i().map(({route:c,path:h,params:f})=>({originalPath:c.originalPath,pattern:c.pattern,path:h,params:f})));const o=[];let u;const a=A(Ne(i,(c,h,f)=>{let g=h&&c.length===h.length;const b=[];for(let d=0,L=c.length;d<L;d++){const R=h&&h[d],v=c[d];f&&R&&v.route.key===R.route.key?b[d]=f[d]:(g=!1,o[d]&&o[d](),H(C=>{o[d]=C,b[d]=Zt(t,b[d-1]||n,()=>a()[d+1],()=>i()[d],l)}))}return o.splice(c.length).forEach(d=>d()),f&&g?f:(u=b[0],b)}));return x(xe,{get when(){return a()&&u},keyed:!0,children:c=>x(le.Provider,{value:c,get children(){return c.outlet()}})})},rn=e=>{const t=pe(()=>e.children);return se(e,{get children(){return t()}})},sn=()=>{const e=Pe();return x(xe,{get when(){return e.child},keyed:!0,children:t=>x(le.Provider,{value:t,get children(){return t.outlet()}})})};function on(e){e=se({inactiveClass:"inactive",activeClass:"active"},e);const[,t]=Me(e,["href","state","class","activeClass","inactiveClass","end"]),n=Ht(()=>e.href),r=Vt(n),s=Xt(),i=A(()=>{const l=n();if(l===void 0)return!1;const o=M(l.split(/[?#]/,1)[0]).toLowerCase(),u=M(s.pathname).toLowerCase();return e.end?o===u:u.startsWith(o)});return(()=>{const l=en();return De(l,se(t,{get href(){return r()||e.href},get state(){return JSON.stringify(e.state)},get classList(){return{...e.class&&{[e.class]:!0},[e.inactiveClass]:!i(),[e.activeClass]:i(),...t.classList}},get["aria-current"](){return i()?"page":void 0}}),!1,!1),l})()}const ln=k('<svg><path fill-rule="evenodd" d="M7.72 12.53a.75.75 0 010-1.06l7.5-7.5a.75.75 0 111.06 1.06L9.31 12l6.97 6.97a.75.75 0 11-1.06 1.06l-7.5-7.5z" clip-rule="evenodd"></svg>',!1,!0),cn={path:()=>ln(),outline:!1,mini:!1},un=k("<svg>"),an=e=>{const[t,n]=Me(e,["path"]);return(()=>{const r=un();return De(r,se({get viewBox(){return t.path.mini?"0 0 20 20":"0 0 24 24"},get fill(){return t.path.outline?"none":"currentColor"},get stroke(){return t.path.outline?"currentColor":"none"},get["stroke-width"](){return t.path.outline?1.5:void 0}},n),!0,!0),U(r,()=>t.path.path),r})()},fn=k('<nav class="bg-white shadow px-2"><div class="flex flex-row h-12 items-center"><div class="text-black flex-1 "> '),hn=k('<h4 class="mx-2 pt-4 pb-2 text-2xl font-bold dark:text-white">'),dn=e=>(()=>{const t=fn(),n=t.firstChild,r=n.firstChild,s=r.firstChild;return U(n,x(xe,{get when(){return e.back},get children(){return x(an,{onClick:()=>history.back(),path:cn,class:"mr-2 h-6 w-6  text-blue-700 hover:text-blue-500"})}}),r),U(r,()=>e.children,s),t})();function gn(e){return(()=>{const t=hn();return U(t,()=>e.children),t})()}const yn=k("<h2>Jobs"),mn=k("<button>Run"),wn=k('<div class="m-2">'),pn=k("<div>"),bn=()=>{const[e,t]=B([]);return tt(async()=>{t(await(await fetch("/api/runs")).json())}),[x(dn,{back:!1,children:"Runs"}),yn(),mn(),x(gn,{children:"Runs"}),(()=>{const n=wn();return U(n,x(ht,{get each(){return e()},children:(r,s)=>(()=>{const i=pn();return U(i,x(on,{href:`/run/${r}`,children:r})),i})()})),n})()]};function An(){return x(nn,{get children(){return x(rn,{path:"/",component:bn})}})}Pt(()=>x(tn,{get source(){return It()},get children(){return x(An,{})}}),document.getElementById("app"));
