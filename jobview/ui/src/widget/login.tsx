import { useNavigate } from "@solidjs/router"
import { Component, JSXElement, createEffect } from "solid-js"
import {
    parseCreationOptionsFromJSON,
    create,
    get,
    parseRequestOptionsFromJSON,
    supported,
    AuthenticationPublicKeyCredential,
  } from "@github/webauthn-json/browser-ponyfill";
import { type PublicKeyCredentialDescriptorJSON } from "@github/webauthn-json";
import { RegistrationPublicKeyCredential } from "@github/webauthn-json/browser-ponyfill"
import type { RegistrationResponseExtendedJSON } from "@github/webauthn-json/browser-ponyfill/extended"

export const Center : Component<{children: JSXElement}> = (props) => {
    return <div class="grid place-items-center h-screen">
                <div class='w-64'>
                    {props.children}
                    </div></div>
}

export const LoginUser : Component<{oninput: (x:string)=>void}> = (props) => {
    let inp : HTMLInputElement
    return <>
          <div class="space-y-6">
        <div>
          <label for="username" class="block text-sm font-medium leading-6 text-neutral-900 dark:text-white">User name</label>
          <div class="mt-2">
            <input ref={inp!} id="username" name="username" type="username" autocomplete="email" required class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-2"/>
          </div>
        </div><div>
        <button onClick={()=>props.oninput(inp.value)} class="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Sign in</button>
        </div>
        </div>
        <img class='my-8' alt='' src='qr.png'/>
        <div>Scan with your phone camera to log in on phone</div>
     </>
}

export const LoginPassword : Component<{oninput: (x:string)=>void}> = (props) => {
    let inp : HTMLInputElement
return  <><form>
<div class="space-y-6">
<div>
<label for="password" class="block text-sm font-medium leading-6 text-neutral-900 dark:text-white">Password</label>
<div class="mt-2">
  <input ref={inp!} id="password" name="password" type="password" autocomplete="email" required class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-2"/>
</div>
</div><div>
<button onClick={()=>props.oninput(inp!.value)} class="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Sign in</button>
</div>
</div>
</form></>


}


export const PasswordPage = () => {
    const navigate = useNavigate();
    const login = () => {
      sessionStorage.setItem('token', 'mytokenisawesome');
      navigate('/home', { replace: true });
    };
  
    createEffect(() => {
      if(sessionStorage.getItem('token')) {
        navigate('/home', { replace: true })
      }
    })
    return                 <Center>
    <LoginPassword oninput={(x: string)=>{login()}}></LoginPassword>
    </Center>
}
export const LoginPage = () => { 
    const navigate = useNavigate();
    const login = () => {
        navigate("/pw", { replace: true })
    }
    createEffect(() => {
        if(sessionStorage.getItem('token')) {
          navigate('/home', { replace: true })
        }
      })
    return                 <Center>
        {supported() ? <div>Supported</div> : <div>Not supported</div>}
        <button onClick={register}>Register</button>
        <button onClick={()=>authenticate()}>Authenticate</button>
        <button onClick={()=>setRegistrations([])}>Clear</button>
    <LoginUser oninput={(x: string)=>{login()}}></LoginUser>
    </Center>
}

// demo mostly uses non ponyfill functions
function registeredCredentials(): PublicKeyCredentialDescriptorJSON[] {
    return getRegistrations().map((reg) => ({
      id: reg.rawId,
      type: reg.type,
    }));
  }
async function register(): Promise<void> {
    const cco = parseCreationOptionsFromJSON({
      publicKey: {
        challenge: "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC",
        rp: { name: "Localhost, Inc." },
        user: {
          id: "IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII",
          name: "test_user",
          displayName: "Test User",
        },
        pubKeyCredParams: [],
        excludeCredentials: registeredCredentials(),
        authenticatorSelection: { userVerification: "discouraged" },
        extensions: {
          credProps: true,
        },
      },
    });
    addRegistration(await create(cco));
  }

  async function authenticate(options?: {
    conditionalMediation?: boolean;
  }): Promise<AuthenticationPublicKeyCredential> {
    const cro = parseRequestOptionsFromJSON({
      publicKey: {
        challenge: "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC",
        allowCredentials: registeredCredentials(),
        userVerification: "discouraged",
      },
    });
    return get(cro);
  }

// use localStorage to save registrations.
const getRegistrations =() => JSON.parse(localStorage.webauthnExampleRegistrations || "[]") as RegistrationResponseExtendedJSON[];
function setRegistrations(registrations: RegistrationResponseExtendedJSON[] ): void {
    localStorage.webauthnExampleRegistrations = JSON.stringify( registrations,null, "  ",
    );
  }
  function addRegistration( registration: RegistrationPublicKeyCredential ): void {
    const registrations = getRegistrations();
    registrations.push(registration.toJSON());
    setRegistrations(registrations);
  }
