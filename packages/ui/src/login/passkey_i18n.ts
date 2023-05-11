
import { JSX } from "solid-js/web/types/jsx"
import { ln, useLocation } from "../core/dg"
// interface Ln {
//     signin: string
//     register: string
//     addPasskey: string
//     notNow: string
//     notEver: string
// }

type KeyValue = [number, string]

// idea of bitmask is to allow a filter; not every client allows every factor
export enum Factor {
    kUnknown = 0,
    kPasskey = 1,
    kPasskeyp = 2,
    kTotp = 3,
    kMobile = 4,
    kEmail = 5,
    kApp = 6,
    kVoice = 7,
    kNone = 8,  // stop asking
}
export const factors: KeyValue[] = [
    [Factor.kPasskey, "Passkey"],
    //[Factor.kPasskeyp, "Passkey and Password"],
    [Factor.kTotp, "Time Code"],
    [Factor.kMobile, "Phone"],
    [Factor.kEmail, "Email"],
    //[Factor.kApp, "Phone App"],
    //[Factor.kVoice, "Voice Call"],
]



const LTR = {
    dir: "ltr" as JSX.HTMLAttributes<HTMLHtmlElement>['dir'],
}
const RTL = {
    dir: "rtl" as JSX.HTMLAttributes<HTMLHtmlElement>['dir'],
}
const en = {
    ...LTR,
    signin: "Sign in",
    register: "Create account",
    addPasskey1: "Would you like to add a passkey to your account?",
    addPasskey2: "Passkeys are safer than passwords and can be used to sign in to your account.",
    add: "Add",
    notNow: "Later",
    notEver: "No",
    username: "Username",
    password: "Password",
    show: "Show",
    hide: "Hide",
    enterUsername: "Enter username",
    viewPasskey: "Tap to view passkey",
    enterPasskey: "Choose passkey",
    choosePasskey: "Choose passkey",
    more2fa: "More choices",
    invalidCode: "Invalid code",
    enterPassword: "Enter password",
    forgotPassword: "Forgot password?",
    forgotUsername: "Forgot username?",
    email: "Email",
    phone: "Phone",
    phoneOrEmail: "Phone or Email",
    invalidPassword: "Invalid user name or password",
    recover: "Recover account",
    invalidLogin: "Invalid login",
    save: "Save",
    cancel: "Cancel",
    enterCode: "123456",
    test: "Test",
    changeLoginSettings: "Change login settings",

    "passkey": "Passkey",
    "passkeyp": "Passkey and Password",
    "totp": "Time Code",
    "totpp": "Time Code and Password",
    "app": "Phone App",
    "ssh": "SSH",
}
type Ln = typeof en
const es: Ln = {
    ...en,
    signin: "accceso",

    username: "nombre de usuario",
    password: "contraseña",
    show: "mostrar",
    hide: "ocultar",
    register: "crear cuenta",

}
const iw: Ln = {
    ...en,
    ...RTL,
    signin: "התחברות",
    username: "שם משתמש",
    password: "סיסמה",
    show: "הצג",
    hide: "הסתר",
    register: "צור חשבון",
}
const allLn: { [key: string]: Ln } = {
    en,
    es,
    iw
}

export const useLn = (): () => Ln => {
    //const p = useParams<{ ln: string }>();
    const loc = useLocation()
   
    return () => {
        const ln = loc.pathname.split('/')[2]
        return allLn[ln] ?? allLn['en']
    }
}

export function lx(key: string): string {
    const l = allLn[ln()] ?? allLn['en']
    return l[key as keyof Ln] ?? key
}
export const _ = lx