import { Component, JSXElement, createEffect } from "solid-js"
import { LanguageSelect, useLn } from "../../i18n-solid/src/i18n_solid"
import { Ab, Center, DarkButton } from "../../ui-solid/src"


export const SimplePage: Component<{ children: JSXElement }> = (props) => {
    const ln = useLn()
    // @ts-ignore
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