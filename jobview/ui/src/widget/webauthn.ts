// A minimal example to test `webauthn-json`.
// Note: do not hardcode values in production.

import { type PublicKeyCredentialDescriptorJSON } from "@github/webauthn-json";
import { RegistrationPublicKeyCredential } from "@github/webauthn-json/browser-ponyfill"
import type { RegistrationResponseExtendedJSON } from "@github/webauthn-json/browser-ponyfill/extended"
import {
  parseCreationOptionsFromJSON,
  create,
  get,
  parseRequestOptionsFromJSON,
  supported,
  AuthenticationPublicKeyCredential,
} from "@github/webauthn-json/browser-ponyfill";

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
  saveRegistration(await create(cco));
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

async function clear(): Promise<void> {
  setRegistrations([]);
}



// use localStorage to save registrations.
export function getRegistrations(): RegistrationResponseExtendedJSON[] {
    const registrations = JSON.parse(
      localStorage.webauthnExampleRegistrations || "[]",
    );
    return registrations;
  }
  
  export function setRegistrations(
    registrations: RegistrationResponseExtendedJSON[],
  ): void {
    localStorage.webauthnExampleRegistrations = JSON.stringify(
      registrations,
      null,
      "  ",
    );
  }
  
  export function saveRegistration(
    registration: RegistrationPublicKeyCredential,
  ): void {
    const registrations = getRegistrations();
    registrations.push(registration.toJSON());
    setRegistrations(registrations);
  }
  
  
 
  // adds the test state
//   export function withStatus(selector: string, fn: () => Promise<any>) {
//     return async function () {
//       document.querySelector("#error")!.textContent = "";
//       document.querySelector(selector)!.textContent = "…";
//       try {
//         await fn();
//         document.querySelector(selector)!.textContent = " ✅";
//       } catch (e) {
//         document.querySelector(selector)!.textContent = " ❌";
//         console.error(e);
//         document.querySelector("#error")!.textContent  = e as any
//       }
//     };
//   }
  
// this saves changes to the registration text
//   async function saveInput(): Promise<void> {
//     document.querySelector("#error")!.textContent = "";
//     registrationElem().style.backgroundColor = "rgba(255, 127, 0, 0.5)";
//     try {
//       setRegistrations(JSON.parse(registrationElem().value));
//       registrationElem().style.backgroundColor = "rgba(0, 255, 0, 0.5)";
//     } catch (e) {
//       registrationElem().style.backgroundColor = "rgba(255, 0, 0, 0.5)";
//       console.error(e);
//       document.querySelector("#error")!.textContent = e as any;
//     }
//   }
  

window.addEventListener("load", () => {
  try {
    // registrationElem().addEventListener("keyup", saveInput);
    // registrationElem().addEventListener("change", saveInput);
    // registrationElem().addEventListener("paste", saveInput);
    // document
    //   .querySelector("#register")!
    //   .addEventListener("click", withStatus("#register .status", register));
    // document
    //   .querySelector("#authenticate")!
    //   .addEventListener(
    //     "click",
    //     withStatus("#authenticate .status", authenticate),
    //   );
    // document
    //   .querySelector("#clear")!
    //   .addEventListener("click", withStatus("#clear .status", clear));


    if (
      new URL(location.href).searchParams.get(
        "conditional-mediation-prompt-on-load",
      ) === "true"
    ) {
      authenticate({ conditionalMediation: true }).then(console.log);
    }
  } catch (e) {
    console.error(e);
  }
});