
import { useNavigate, useParams } from "@solidjs/router"
// interface Ln {
//     signin: string
//     register: string
//     addPasskey: string
//     notNow: string
//     notEver: string
// }
const en = {
    signin: "Sign in",
    register: "Create account",
    addPasskey1: "Would you like to add a passkey to your account?",
    addPasskey2: "Passkeys are safer than passwords and can be used to sign in to your account.",
    add: "Add",
    notNow: "Not now",
    notEver: "Not ever",
    username: "Username",
    password: "Password",
    show: "Show",
    hide: "Hide",
    enterUsername: "Enter username",
    enterPasskey: "Choose passkey",
    choosePasskey: "Choose passkey",
}
type Ln = typeof en
const es: Ln = {
    ...en,
    signin: "accceso",

    username: "nombre de usuario",
    password: "contraseña",
    show: "mostrar",
    hide: "ocultar",
    register:   "crear cuenta",

}
const iw: Ln = {
    ...en,
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

type LnDir = () => "rtl" | "ltr"
type LnFn = () => Ln
export const useLn = (): [LnFn, LnDir] => {
    const p = useParams<{ ln: string }>();
    return [() => allLn[p.ln??'en'], () => p.ln == "iw" ? "rtl" : "ltr"]
}

