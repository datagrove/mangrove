import { Component, For, JSXElement, Switch, Match, Show, createEffect, createSignal } from 'solid-js'
import { pencil, chevronLeft, chevronDown, bars_3, magnifyingGlass, user } from "solid-heroicons/solid"
import { Icon } from 'solid-heroicons'
import { setLogin, useLogout } from '../lib/crypto'
import {
  Popover,
  PopoverButton,
  PopoverPanel,
  ContextMenu,
  ContextMenuBoundary,
  ContextMenuPanel,
  Transition,
  Menu,
  MenuItem,
  Dialog,
  ButtonProps,
} from 'solid-headless';
import Dismiss from 'solid-dismiss'
import { DarkButton, SearchList, SiteMenuContent, searchMode, setSearchMode } from './site_menu'
import { BlueButton, Center } from '../lib/form'
import { AnchorProps, A as Ar, useNavigate } from '../core/dg';
import { LanguageSelect } from '../i18n/i18';
import { useLn } from '../login/passkey_i18n';
function classNames(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
// this should probably be a media query
const [small, setSmall] = createSignal(false)

export type PageParams = Partial<{
  ln: string
  org: string
  db: string
  table: string
  path: string
  tag: string
}>

function Separator() {
  return (
    <div class="flex items-center" aria-hidden="true">
      <div class="w-full border-t border-gray-200" />
    </div>
  );
}

export const InlineButton: Component<ButtonProps> = (props) => {
  return <button {...props} class={`text-indigo-600 hover:text-blue-500 hover:underline ${props.class}`}>{props.children}</button>
}
export const Ab: Component<AnchorProps> = (props) => {
  return <Ar {...props} class={`text-indigo-600 hover:text-blue-500 hover:underline ${props.class}`} href={props.href}>{props.children}</Ar>
}
export const Bb: Component<ButtonProps> = (props) => {
  return <button {...props} class={`text-indigo-600 hover:text-blue-500 hover:underline ${props.class}`} onClick={props.onClick}>{props.children}</button>
}



// the drawer can be
// full screen | overlay | side

export const Title: Component<{
  back?: string
  children?: JSXElement
}> = (props) => {
  const navigate = useNavigate()

  const startSearch = () => {
    setOpenDrawer(true)
    setSearchMode(true)
  }

  const [x, setX] = createSignal(0);
  const [y, setY] = createSignal(0);
  let btn: HTMLButtonElement;
  return <>
    <Show when={false}>
      <div class='fixed flex left-[50] top-2 p-2 border-solid w-48 border-neutral-500 rounded-md bg-neutral-800'>
        <button ref={btn!} onClick={() => setOpenDrawer(true)}> <Icon path={bars_3} class='mr-2 h-6 w-6  text-blue-700 hover:text-blue-500' /></button>
        <input readOnly placeholder='Search' type='text' class='bg-transparent focus:outline-none w-full text-white' onClick={startSearch} />
        <Icon path={magnifyingGlass} class='mr-2 h-6 w-6  text-blue-700 hover:text-blue-500' />
      </div>
      <Drawer button={btn!} />
    </Show>
    <Account />
  </>
}
const [openDrawer, setOpenDrawer] = createSignal(false);

export const Drawer: Component<{ button: HTMLButtonElement }> = (props) => {
  const nav = useNavigate()
  createEffect(() => {
    if (!openDrawer()) {
      setSearchMode(false)
    }
  })
  const editSite = () => {

  }
  return <>
    <Dismiss
      menuButton={props.button}
      open={openDrawer}
      setOpen={setOpenDrawer}
    >
      <div class=''>
        <SiteMenuContent></SiteMenuContent>
        <button onClick={editSite} class='z-60 fixed p-2 bottom-2 right-2 rounded-full text-blue-700 hover:text-blue-500'><Icon class='h-6 w-6' path={pencil} /></button>
      </div></Dismiss></>
}

// todo!! this is ugly
export const Account: Component = () => {
  const nav = useNavigate()
  const logOut = useLogout()
  const [open, setOpen] = createSignal(false);
  let btnEl: HTMLButtonElement;
  const add = () => { }
  const modify = () => { nav('/en/me/~/access') }
  const [account, setAccount] = createSignal([]);
  return <><button title='account' ref={btnEl!} class='fixed  right-2 top-2 p-2 rounded-full bg-neutral-800' >
    <Icon path={user} class='h-6 w-6'></Icon></button>
    <button class='z-60 fixed p-2 bottom-2 right-2 rounded-full bg-neutral-900'><Icon class='h-6 w-6' path={pencil} /></button>
    <Dismiss
      menuButton={btnEl!}
      open={open}
      setOpen={setOpen}
    >

      <div class='fixed right-2 top-14 w-48  rounded-md bg-gradient-to-r from-neutral-800 to-neutral-800 '>
        <div class='space-y-2 p-2'>
          <BlueButton onClick={modify}> this account</BlueButton>
          <For each={account()}>{(a) => <BlueButton onClick={add}>{a}</BlueButton>}</For>
          <BlueButton onClick={add}> Add another account</BlueButton>
          <BlueButton onClick={logOut}>Signout</BlueButton>
        </div>
      </div></Dismiss>

  </>
}

export const Body: Component<{ children: JSXElement }> = (props) => {
  return <div class="m-2">{props.children}

  </div>
}
export const SimplePage: Component<{ children: JSXElement }> = (props) => {
  const ln = useLn()
  return <><div dir={ln().dir} class='px-2 space-x-1 my-2 fixed w-screen flex flex-row items-center'>
    <div class='flex-1 '/>
    <div class='w-48 '><LanguageSelect /></div>
    <DarkButton /></div>
    <Center>
      {props.children}
    </Center></>
}
export const Page: Component<{ children: JSXElement }> = (props) => {
  return <div class='flex h-screen v-screen '>
    <div class='w-80 h-full overflow-auto dark:bg-gradient-to-r dark:from-neutral-900 dark:to-neutral-800'><SiteMenuContent></SiteMenuContent></div>
    <div class='flex-1 p-2 h-full overflow-auto '><div class={small() ? 'h-12' : ''}></div>{props.children}</div>
  </div>
}

interface Tab {
  name: string,
  route: string,
}
export const Tab: Component<{ tab: Tab, selected: boolean }> = (props) => {
  return <Switch>
    <Match when={props.selected}> <a class="inline-flex items-center border-b-2 border-indigo-500 px-1 pt-1 text-sm font-medium text-gray-900">{props.tab.name}</a></Match>
    <Match when={!props.selected}> <Ab href={props.tab.route} class="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700">{props.tab.name}</Ab></Match>
  </Switch >
}

export const Nav: Component<{ selected: number, tabs: Tab[] }> = (props) => {
  return <nav class="bg-white shadow">
    <div class="mx-auto px-2 sm:px-6 lg:px-8">
      <div class="relative flex h-16 justify-between">
        <div class="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
          <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
            <For each={props.tabs}>{(e, i) => <Tab tab={e} selected={props.selected == i()} />
            }</For>
          </div>
        </div></div></div></nav>
}
export const BackNav: Component<{ children: JSXElement, back: boolean }> = (props) => {
  return <nav class="bg-white shadow px-2">
    <div class="flex flex-row h-12 items-center">
      <Show when={props.back}>
        <Icon onClick={() => history.back()} path={chevronLeft} class='mr-2 h-6 w-6  text-blue-700 hover:text-blue-500' />
      </Show>
      <div class='text-black flex-1  ' >{props.children} </div>

    </div></nav>
}

export function H2(props: { children: JSXElement, class?: string }) {
  const c = `pt-4 text-2xl font-bold dark:text-white ${props.class}`
  return <h4 class={c}>{props.children}</h4>
}
export function H3(props: { children: JSXElement }) {
  return <h4 class="pt-4 text-2xl font-bold dark:text-white">{props.children}</h4>
}
export function TagList(props: { each: string[] }) {
  if (!props.each.length) return <div />
  else {
    const [first, ...rest] = props.each
    return <div>
      <For each={rest}>{(e, i) => `, ${e}`}</For>
    </div>
  }
}

function PictureName(props: { path: string }) {
  return <a id={props.path.split('/')[1]} ><h4 class="pt-4 text-2xl font-bold dark:text-white">{props.path.split("/").slice(1).join(": ")}</h4></a>
}