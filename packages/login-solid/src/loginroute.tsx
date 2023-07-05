import { useNavigate } from "@solidjs/router";
import { JSXElement, createContext, useContext } from "solid-js";
import { Login } from "./login";
import { useLn } from "../../i18n-solid/src";
import { SimplePage } from "./simplepage";
import { H2, P, Ab } from "../../ui-solid/src";
import { Channel, Peer, apiCall } from "../../abc/src";


// const LoginRoutes = () => {
//     const nav = useNavigate()
//     return <Routes>
//         <Route path={`/:ln/login`} component={LoginPage} />
//         <Route path={`/:ln/login`} component={LoginPage} />
//         <Route path={`/:ln/settings`} component={SettingsPage} />
//         <Route path={`/:ln/register`} component={RegisterPage} />
//         <Route path={`/:ln/register2`} component={RegisterPage2} />
//         <Route path="*" component={() => {
//             nav("/en/login")
//             return <></>
//         }} />
//     </Routes>
// }

// use mini router here, or a switch?

// const [suspense, Suspense] = createSignal(false)
// const finishLogin = (i: LoginInfo) => {
//     props.setLogin(i)
//     nav('../menu')
//     return
//     console.log("finish login", i)
//     i.cookies.forEach((c) => {
//         document.cookie = c + ";path=/"
//     })
//     //location.href = i.home
//     // we can't nav here because it may go to a different page


//     // conditionally we may want to do nav here instead of location.href
//     // how do we know? maybe h is empty?
//     //location.href = h
//     if (i.home == "../home")
//         nav("../home")
//     else {
//         const h = i.home ? i.home : props.afterLogin ?? "/"
//         location.href = h
//     }
// }

export function LoginOrRegister()  {
    const props = useLogin()
    const ln = useLn()
    const nav = useNavigate()

    return <SimplePage>
        <H2 class='mb-2'>{ln().signin}</H2>
        <P class='hidden mb-4'>{ln().welcomeback}</P>
        <Ab class='block mt-2 mb-3' href='../register'>{ln().ifnew}</Ab>
        <Login  />
    </SimplePage>
}

// return this from login process? anything else? a screen name
export interface LoginInfo {
    home: string,
    email: string,
    phone: string,
    cookies: string[],
    options: number
}
export interface ChallengeNotify {
    challenge_type: number
    challenge_sent_to: string
    other_options: number
    login_info?: LoginInfo
}


export interface LoginApi {
    loginpassword: (user: string, password: string) => Promise<[ChallengeNotify,string]>
    loginpassword2: (secret: string) => Promise<[LoginInfo,string]>
    register(name: string): Promise<any>
    registerb(cred: any): Promise<[string,string]>
    addpasskey(): Promise<any>
    addpasskey2(cred:any): Promise<[string,string]>
    login2(cred: any): Promise<LoginInfo>
    login(deviceId: string) : Promise<any>
    recover(email: string, phone: string) : Promise<void>
    recover2(otp: string) : Promise<void>
}
export function loginApi(ch: Peer): LoginApi {
    return apiCall(ch,"loginpassword", "loginpassword2", "register", "registerb", "addpasskey", "addpasskey2", "login2", "login", "recover", "recover2")
}

export interface LoginProps {
    api: LoginApi
    createAccount?: string
    recoverUser?: string
    recoverPassword?: string
    afterLogin?: string
    setLogin: (sec: LoginInfo) => void
    children: JSXElement
}
const LoginContext = createContext<LoginProps>()
export function LoginProvider(props: LoginProps) {
    return <LoginContext.Provider value={props}>
        {props.children}
    </LoginContext.Provider>
}

export function useLogin() { 
    const r = useContext(LoginContext)
    if (!r) throw "requires login context"
    return r
}

interface Option {
    name: string
    default: boolean
    allowed: boolean
}

interface PasswordRules {
    kinds: number
    length: number
}

interface SecurityPolicy {
    options: {
        [key: string]: Option
    }
    passwordRules: PasswordRules
}
