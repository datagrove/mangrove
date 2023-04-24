

// autoLogin false until we resolve if we can automatically login

import { createSignal } from "solid-js"
import { createWs } from "./socket"
import { bufferToHex } from "./encode"
import * as bip39 from 'bip39'
import * as ucans from "@ucans/ucans"
import * as ed25519 from "@stablelib/ed25519"
import { Buffer } from 'buffer'
import { EdKeypair } from "@ucans/ucans"
import { useNavigate } from "@solidjs/router"
// @ts-ignore
window.Buffer = Buffer;

// if we succeed, we set the token
// if security is not in local storage, 
export interface Security {
  // these are required, we might as well generate them when we start if not available
  userDid: string
  userPrivate: string
  deviceDid: string
  devicePrivate: string

  username: string  // the user name being empty is used to trigger register.
  deviceName: string

  ucan: string[]
  registered: boolean
  autoconnectUntil: number
}

// when we logout, should we remove the device key? that would require storing it on the server, a tradeoff.
export const useLogout = () => {
  const navigate = useNavigate()
  return () => {
    sessionStorage.removeItem('token');
    setLogin(false)
    navigate('/', { replace: true });
  }
}

function init() : Security {
  const a = localStorage.getItem('security')
  if (a) {
    return JSON.parse(a) as Security
  } else return {
    userDid: "",
    userPrivate: "",
    username: "",
    deviceName: "",
    deviceDid: "",
    devicePrivate: "",
    ucan: [],
    autoconnectUntil: 0,
    registered: false
  } 
}

// true directly after registration
export const [welcome, setWelcome] = createSignal(true)

// set undefined to false to test without webauthn
export const [hasWebAuthn, setHasWebAuthn] = createSignal(undefined as boolean|undefined)
// if login is true we can go to any page.
export const [login, setLogin] = createSignal(false)
export const [user, setUser] = createSignal<string>('')
export const [security, setSecurity_] = createSignal<Security>( init())
export const setSecurity = (s: Security) => {
  localStorage.setItem('security', JSON.stringify(s));
  setSecurity_(s)
}

export const [error, setError] = createSignal("")
export const isMobile: boolean = (navigator as any)?.userAgentData?.mobile ?? false;

(async ()=>{
  if (hasWebAuthn()==undefined) {
  if (typeof(PublicKeyCredential) != "undefined" && typeof(PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) != "undefined"){
   const b = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
   setHasWebAuthn(b)
  } else {
     setHasWebAuthn(false)
   }
  }
})()


// export enum StartState {
//   starting = 0,
//   loginNeeded = 2,
//   active = 3
// }
// export const [startState, setStartState] = createSignal<number>(0)


export const generatePassPhrase = () => bip39.generateMnemonic()

// user name here needs to identify the domain that's tracking it?
// otherwise it won't be unique.
// we could simply use the hash of the private key, but then it could never be changed or revoked. certificate transparency offers solutions here? can datagrove sign the domain?
// 
export interface xx {
  username: string
}
export interface DeviceCertificate {
  username: string
  deviceName: string
  publicKey: JsonWebKey
  expires: number
  usefor: string[]
}

export async function ucanFromBip39(bip: string, did: string, serviceDid: string) {
  const s = security()
  const seed = bip39.mnemonicToSeedSync(bip).subarray(0, 32)
  const kp = ed25519.generateKeyPairFromSeed(seed)
  const keypair = new EdKeypair(kp.secretKey, kp.publicKey, true)

  const ucan = await ucans.build({
    audience: serviceDid, // recipient DID
    issuer: keypair, // signing key
    capabilities: [ // permissions for ucan
      {
        with: { scheme: "login", hierPart: s!.userDid },
        can: { namespace: "login", segments: ["LOGIN"] }
      },
    ]
  })
  const token = ucans.encode(ucan) // base64 jwt-formatted auth token 
  return token
}

export async function tryToLogin() {
  let a = security()
  if (!a.userDid) {
    const keypair = await ucans.EdKeypair.create({exportable: true})
    a.deviceName = keypair.did()
    a.devicePrivate = await keypair.export("base58btc")
    a.deviceDid = keypair.did()
    const user = await ucans.EdKeypair.create({exportable: true})
    a.userDid = user.did()
    a.userPrivate = await user.export("base58btc")
    setSecurity(a)
    setLogin(true)
  } else {
    if (a.autoconnectUntil==0 || a.autoconnectUntil > Date.now()) {
      const ws =  createWs()
      const did = await ws.did()
      const keypair = await ucans.EdKeypair.fromSecretKey(a.devicePrivate)
      const ucan = await ucans.build({
        audience: did, // recipient DID
        issuer: keypair, // signing key
        capabilities: [ // permissions for ucan
          {
            with: "login://"+a.userDid,
            can: "*"
          }
        ]
      })
      const r = await ws.rpc<{ token: string }>('ucanconnect', ucan)
      setLogin(true)
      setUser(a.username)
      setLogin(true)
    } else {
      setLogin(true)
    }
  }

}
  
tryToLogin()

//         // we have our passphrase now, we can create a certificate and register it
        // then we could finish the setup with webauthn. we could even skip it
//        const cert = ucanFromBip39(mn, sec!.did, await ws.did())