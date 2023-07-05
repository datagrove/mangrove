
import { Show, createSignal } from 'solid-js'
import './pass.css'
import { generatePassPhrase } from '../crypto'

// const form = document.querySelector('form');
// const passwordInput = document.querySelector('input#current-password');
// const signinButton = document.querySelector('button#signin');
// const togglePasswordButton = document.querySelector('button#toggle-password');


// togglePasswordButton.addEventListener('click', togglePassword);



// // passwordInput.addEventListener('input', validatePassword);

// // A production site would use more stringent password testing on the client
// // and would sanitize and validate passwords on the back end.
// function validatePassword() {
//   let message= '';
//   if (!/.{8,}/.test(passwordInput.value)) {
// 		message = 'At least eight characters. ';
//   } else if (!/.*[A-Z].*/.test(passwordInput.value)) {
//     message += '\nAt least one uppercase letter. ';
// } else if (!/.*[a-z].*/.test(passwordInput.value)) {
//     message += '\nAt least one lowercase letter.';
// } else {
//     // message += '\nPassword is incorrect. Please try again.';
// }

// passwordInput.setCustomValidity(message);
// }

// form.addEventListener('submit', handleFormSubmit);

// function handleFormSubmit(event) {
//     console.log('submit');
//     if (form.checkValidity() === false) {
//         console.log('not valid');
//         event.preventDefault();
//     } else {
//         // On a production site do form submission.
//         alert('Signing in!')
//         signinButton.disabled = 'true';
//         event.preventDefault();
//         document.body.innerHTML = "<p style='font-size: 24px'>You are now signed in.</p>"
//     }
// }

export function PasswordManager() {
    const [once, setOnce] = createSignal(false)
    const [password, setPassword] = createSignal('')
    const a = generatePassPhrase()
    const fn = (e: Event) => {
        // e.preventDefault()
        console.log(password(), e)
        setOnce(true)
    }

    let el: HTMLInputElement
    function togglePassword() {
        if (el.type === 'password') {
            el.type = 'text';
        } else {
            el.type = 'password';
        }
    }
    return <div class='text-black'>
        <Show when={!once()}>
            <form action="#" method="post" onSubmit={fn}>

                <h1>Sign in</h1>

                <section>
                    <label for="username">Email</label>
                    <input id="username" name="username" type="text" autocomplete="username" required autofocus />
                </section>

                <section>
                    <label for="password">Password</label>
                    <button onClick={togglePassword} id="toggle-password" type="button" aria-label="Show password as plain text. Warning: this will display your password on the screen.">Show password</button>
                    <input ref={el!} id="password" name="password" type="password" autocomplete="current-password" minlength="8" aria-describedby="password-constraints" required />
                    <div id="password-constraints">Eight or more characters, with at least one lowercase and one uppercase letter.</div>
                </section>

                <button id="sign-in">Sign in</button>

            </form></Show>
    </div>
}