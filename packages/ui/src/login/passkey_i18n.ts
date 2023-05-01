
import { JSX } from "solid-js/web/types/jsx"
import { ln } from "../core/dg"
// interface Ln {
//     signin: string
//     register: string
//     addPasskey: string
//     notNow: string
//     notEver: string
// }

type KeyValue = [string, string]
export const factors: KeyValue[] = [
    ["passkey", "Passkey"],
    ["passkey+", "Passkey and Password"],
    ["totp", "Time Based Code"],
    ["sms", "Text Message"],
    ["email", "Email"],
    ["app", "Phone App"],
    ["voice", "Voice Call"],
]

export const codeBased = (x: string) => {
    return x === "totp" || x === "sms" || x === "email" || x === "voice"
}
export const socketBased = (x: string) => {
    return x === "app"
}
export const webauthnBased = (x: string) => {
    return x === "passkey" || x === "passkey+"
}


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

