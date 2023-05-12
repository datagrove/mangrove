import { Component, JSXElement } from "solid-js"
import { LanguageSelect } from "../i18n/i18"
import { DarkButton } from "../layout/site_menu"
import { Center } from "../lib/form"
import { useLn } from "./passkey_i18n"
import { Ab } from "../layout/nav"

export const SimplePage: Component<{ children: JSXElement }> = (props) => {
    const ln = useLn()
    return <><div dir={ln().dir} class='px-2 space-x-1 my-2 fixed w-screen flex flex-row items-center'>

      <div class='flex-1 '/>
      <div class='w-48 '><LanguageSelect /></div>
      <DarkButton />
      <Ab href='#'>{ln().help}</Ab>
      </div>
      <Center>
        {props.children}
      </Center></>
  }