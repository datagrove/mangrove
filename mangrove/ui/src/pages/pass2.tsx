import { Show, createSignal } from "solid-js"
import { A, Body, Page } from "../layout/nav"
import { Center, FieldSet } from "../lib/form"
import { createUser, generatePassPhrase, setLogin } from "../lib/crypto"
import { useNavigate } from "@solidjs/router"


export const PassworOrBip39 = () => {
    const nav = useNavigate()
    const [hide, setHide] = createSignal(true)
    const [bip39, setBip39] = createSignal(false)
    const fn = (e: Event) => {
        // e.preventDefault()


    }

    let el: HTMLInputElement
    function togglePassword() {
        if (el.type === 'password') {
            el.type = 'text';
        } else {
            el.type = 'password';
        }
    }
    const [mn,setMn] = createSignal(generatePassPhrase())
    const generate = () => {
        setMn(generatePassPhrase())
    }
    const signin = async (e: SubmitEvent) => {
        e.preventDefault()
        if (bip39()) {
            createUser(mn(),true)
        } else {
            const w = window as any
            if (w.PasswordCredential) {
                // @ts-ignore
                var c = await navigator.credentials.create({ password: e.target });
                await navigator.credentials.store(c!);
                createUser(el!.value,true)
            }
        }
        nav("/")
    }
    return <Center>
        <form>
            <p class="text-md dark:text-white text-gray-500">How do you want to protect your identity?</p>

            <fieldset class='my-4'>
                <div class="space-y-4">


                    <div class="flex items-center">
                        <input checked onInput={() => setBip39(false)} class="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-600" id='google' type='radio' name='type' value='password' />
                        <label class="ml-3 block text-sm font-medium leading-6 dark:text-white text-gray-900" for='google'>Password manager</label></div>                   
                        
                         <div class="flex items-center">
                        <input class="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-600"  id='paper' type='radio' name='type' value='bip39' onInput={() => setBip39(true)} />
                        <label class="dark:text-white ml-3 block text-sm font-medium leading-6 text-gray-900" for='paper'>Paper</label>   </div>
                </div>
            </fieldset>
        </form>
        <form onSubmit={signin} class="space-y-6 mt-4" action="#" method="post">
            <Show when={bip39()}>

                <div >

                    <div class="flex items-center justify-between">
                        <label for="password" class="block text-sm font-medium leading-6 text-white">BIP39 phrase</label>
                        <div class="text-sm">
                            <button onClick={() => generate()} class="font-semibold text-indigo-400 hover:text-indigo-300">Generate</button>
                        </div>
                    </div>
                    <div id='bip39' class='my-2 p-2 bg-white rounded-md border border-neutral-500 dark:text-black'>{mn()}</div>

                </div>
            </Show>
            <Show when={!bip39()}>
                <div class='hidden'>
                    <div class="mt-2">
                        <input id="username" value="user" name="username" type="text" autocomplete="username" />
                    </div>
                </div>

                <div>
                    <div class="flex items-center justify-between">
                        <label for="password" class="block text-sm font-medium leading-6 text-white">Password</label>
                        <div class="text-sm">
                            <button onClick={() => setHide(!hide())} class="font-semibold text-indigo-400 hover:text-indigo-300">{hide() ? "Show" : "Hide"} password</button>
                        </div>
                    </div>
                    <div class="mt-2">
                        <input id="password" name="password" type={hide() ? "password" : "text"} autocomplete="current-password" required class="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6" />
                    </div>
                </div>



            </Show>
            <div class='mt-4'>
                <button type="submit" class="flex w-full justify-center rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500">Sign in</button>
            </div>
        </form>
    </Center>

}


// class="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
<label for="username" class="block text-sm font-medium leading-6 text-white">Email address</label>