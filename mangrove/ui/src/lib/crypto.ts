

// autoLogin false until we resolve if we can automatically login

import { createSignal } from "solid-js"
import { createWs, createWsAsync } from "./socket"
import { bufferToHex } from "./encode"

// if we succeed, we set the token
export const [tryLogin, setTryLogin] = createSignal(false)
export const [token, setToken] = createSignal<string>('')
export const [user, setUser] = createSignal<string>('')
export const [security, setSecurity] = createSignal<Security>()
export const [error, setError] = createSignal("")
export const isMobile: boolean = (navigator as any)?.userAgentData?.mobile ?? false;
import * as bip39 from 'bip39'
import * as nacl from 'tweetnacl'
import * as ucans from "@ucans/ucans"

import { Buffer } from 'buffer'
// @ts-ignore
window.Buffer = Buffer;

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
export interface Security {
  username: string
  deviceName: string
  privateKey: string
  did: string
  ucan: string[]
  autoconnectUntil: number
}

export function ucanFromBip39(bip: string, did: string): string {
  const seed = bip39.mnemonicToSeedSync(bip).subarray(0, 32)
  //const kp = nacl.sign.keyPair.fromSeed(seed)
  const seedb = bufferToHex(seed)
  ucans.EdKeypair.fromSeed(seedb)

  return JSON.stringify({

  })
}

export async function tryToLogin() {
  let a: Security | null
  let ss = localStorage.getItem('security')
  if (ss) {
    a = JSON.parse(ss) as Security


  } else {
    const keypair = await ucans.EdKeypair.create()
    const did = keypair.did()
    const pk = await keypair.export("base58btc")
    a = {
      privateKey: pk,
      did: did,
      deviceName: "",
      username: "",
      ucan: [],
      autoconnectUntil: 0
    }
    localStorage.setItem('security', JSON.stringify(a));
  }
  if (a.autoconnectUntil > Date.now()) {
    const ws = await createWsAsync()
    const keypair = await ucans.EdKeypair.fromSecretKey(a.privateKey)
    const ucan = {}
    const r = await ws.rpc<{ token: string }>('ucanconnect', ucan)
    setToken(r.token)
    setUser(a.username)
  }
  setTryLogin(true)
}
tryToLogin()

