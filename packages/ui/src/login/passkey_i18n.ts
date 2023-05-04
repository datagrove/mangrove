
import { JSX } from "solid-js/web/types/jsx"
import { ln } from "../core/dg"
// interface Ln {
//     signin: string
//     register: string
//     addPasskey: string
//     notNow: string
//     notEver: string
// }

type KeyValue = [number, string]

export enum Factor {
    kPasskey  = 1,
    kPasskeyp = 2,
    kTotp     = 4,
    kMobile   = 8,
    kEmail    = 16,
    kApp      = 32,
    kVoice    = 64,
    kNone     = 128,  // stop asking
}
export const factors: KeyValue[] = [
    [Factor.kPasskey, "Passkey"],
    [Factor.kPasskeyp, "Passkey and Password"],
    [Factor.kTotp, "Time Based Code"],
    [Factor.kMobile, "Text Message"],
    [Factor.kEmail, "Email"],
    [Factor.kApp, "Phone App"],
    [Factor.kVoice, "Voice Call"],
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
    enterPasskey: "Choose passkey",
    choosePasskey: "Choose passkey",
    more2fa: "More choices",
    invalidCode: "Invalid code",
    enterPassword: "Enter password",
    forgotPassword: "Recover name or password",
    email: "Email",
    phone: "Phone",
    phoneOrEmail: "Phone or Email",
    invalidPassword: "Invalid user name or password",
    recover: "Recover account",
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
    return () => allLn[ln()] ?? allLn['en']
}

