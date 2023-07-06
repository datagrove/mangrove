



// const [lang, setLang] = createSignal<Lang>({
//     "en": "English",
//     "es": "Español",
//     "iw": "עברית"
// })

export const en = {
    ln: "en",
    lnd: "English",
    dir: "ltr",
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
    welcomeback: "Welcome back!",
    help: "Get Help",
    ifnew: "Create your first website",
    "passkey": "Passkey",
    "passkeyp": "Passkey and Password",
    "totp": "Time Code",
    "totpp": "Time Code and Password",
    "app": "Phone App",
    "ssh": "SSH",
    continueWith: "Or continue with",
    register1: "You are good to go!",
    register2: "You don't need to share your email or phone number. We will generate a passkey for you that you can share among your devices. You can change your screen name now or later.",
    register3: "That's ok!",
    register4: "Just fill in your email and password. Or use an account that you already have.",
    recoverWithPhone: "I want a password instead",
}
export type Ln = typeof en
export const es: Ln = {
    ...en,
    ln: "es",
    lnd: "Español",
    signin: "accceso",

    username: "nombre de usuario",
    password: "contraseña",
    show: "mostrar",
    hide: "ocultar",
    register: "crear cuenta",

}
export const iw: Ln = {
    ...en,
    dir: 'rtl',
    ln: "iw",
    lnd: "עברית",
    signin: "התחברות",
    username: "שם משתמש",
    password: "סיסמה",
    show: "הצג",
    hide: "הסתר",
    register: "צור חשבון",
    addPasskey1: "האם ברצונך להוסיף קוד סודי לחשבונך?",
    addPasskey2: "קודי סודי הם יותר בטוחים מסיסמאות וניתן להשתמש בהם להתחברות לחשבונך.",
    add: "הוסף",
    notNow: "לא עכשיו",
    notEver: "לא",
    enterUsername: "הזן שם משתמש",
    welcomeback: "ברוך שובך",
    enterPassword: "הזן סיסמה",
    forgotPassword: "שכחת סיסמה?",
    forgotUsername: "שכחת שם משתמש?",
    changeLoginSettings: "שנה הגדרות התחברות",
}
export const allLn: { [key: string]: Ln } = {
    en,
    es,
    iw
}

/*

export const en = {
    save: "Save",
    cancel: "Cancel",
    insert: "Insert",
}

export const he = {
    save: "להציל",
    cancel: "לְבַטֵל",
    insert: "לְהַכנִיס",
}

interface Ln {
    save: string,
    cancel: string,
    insert: string
}
*/

