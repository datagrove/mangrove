import { Component, JSXElement } from "solid-js"


// to login we need to provide a secret, maybe an invitation
// this would store a cookie so we don't need to keep logging in.
// we could generate invitations once we are logged in.
// we could potentially use ssh to get a secret, then launch a browser to store the cookie.
// ssh something | chrome 
export const Login: Component<{ children: JSXElement, href: string }> = (props) => {
    return <a class='text-blue-700 hover:underline hover:text-blue-600 cursor-pointer' {...props}>{props.children}</a>
}