
import { Component, For, JSXElement, Switch, Match, Show, createEffect, createSignal } from 'solid-js'
import { chevronLeft, chevronDown, bars_3, magnifyingGlass, user } from "solid-heroicons/solid"
import { Icon } from 'solid-heroicons'
import { AnchorProps, A as Ar, Outlet, useNavigate } from '@solidjs/router'
import { setLogin } from './crypto'
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
} from 'solid-headless';
function classNames(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

function Separator() {
  return (
    <div class="flex items-center" aria-hidden="true">
      <div class="w-full border-t border-gray-200" />
    </div>
  );
}

export const A: Component<AnchorProps> = (props) => {
  return <Ar {...props} class={`text-indigo-600 hover:text-blue-500 hover:underline ${props.class}`} href={props.href}>{props.children}</Ar>
}
export const P: Component<{ children: JSXElement, class?: string }> = (props) => {
  return <p class={`${props.class ?? ""} mt-2`}  >{props.children}</p>
}
{

}
export const Title: Component<{
  back?: string
  children?: JSXElement
}> = (props) => {
  const navigate = useNavigate()
  const logOut = () => {
    sessionStorage.removeItem('token');
    setLogin(false)
    navigate('/', { replace: true });
  }
  const [x, setX] = createSignal(0);
  const [y, setY] = createSignal(0);
  return <>
    <div class='fixed flex left-2 top-2 p-2 border-solid w-96 border-neutral-500 rounded-md bg-neutral-800'>
      <Icon onClick={() => history.back()} path={bars_3} class='mr-2 h-6 w-6  text-blue-700 hover:text-blue-500' />
      <input placeholder='Search' type='text' class='bg-transparent focus:outline-none w-full text-white' />
      <Icon path={magnifyingGlass} class='mr-2 h-6 w-6  text-blue-700 hover:text-blue-500' />
    </div>

    <Popover defaultOpen={false} class="fixed right-2 top-2 ">
      {({ isOpen }) => (
        <>
          <PopoverButton
            class={classNames(
              isOpen() && 'text-opacity-90',
              'text-white group bg-neutral-800 px-3 py-2 rounded-full inline-flex items-center text-base font-medium hover:text-opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75',
            )}
          >

            <Icon path={user} class='h-6 w-6'></Icon>
          </PopoverButton>
          <Transition
            show={isOpen()}
            enter="transition duration-200"
            enterFrom="opacity-0 -translate-y-1 scale-50"
            enterTo="opacity-100 translate-y-0 scale-100"
            leave="transition duration-150"
            leaveFrom="opacity-100 translate-y-0 scale-100"
            leaveTo="opacity-0 -translate-y-1 scale-50"
          >
            <PopoverPanel unmount={false} class="absolute  z-10  mt-3 transform -right-0 sm:px-0 lg:max-w-3xl">
              <Menu class=" overflow-hidden w-64 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 bg-neutral-800 flex flex-col space-y-1 p-1">
                <For each={[1, 2, 3, 4, 5, 6, 7, 8, 9]}>{(e, i) => {
                  return <><MenuItem as="button" class="text-sm p-1 text-left rounded hover:bg-purple-600 hover:text-white focus:outline-none focus:bg-purple-600 focus:text-white">
                    {i()} </MenuItem></>
                }}</For>
              </Menu>
            </PopoverPanel>
          </Transition>
        </>
      )}
    </Popover>
  </>
}

export const Title2: Component<{
  back?: string
  children?: JSXElement
}> = (props) => {
  const navigate = useNavigate()
  const logOut = () => {
    sessionStorage.removeItem('token');
    setLogin(false)
    navigate('/', { replace: true });
  }

  return <><BackNav back={!!props.back} >
    {props.children}
    <button onClick={logOut} class="ml-2 inline-flex items-center px-2 py-1 border border-transparent text-xs leading-4 font-medium rounded-full text-white bg-red-600 hover:bg-red-500 focus:outline-none focus:border-red-700 focus:shadow-outline-red active:bg-red-700 transition ease-in-out duration-150">Sign out</button>
  </BackNav></>
}


export const Body: Component<{ children: JSXElement }> = (props) => {
  return <div class="m-2">{props.children}</div>
}
export const Page: Component<{ children: JSXElement }> = (props) => {


  return <><div class='h-12'></div>{props.children}</>
}

interface Tab {
  name: string,
  route: string,
}
export const Tab: Component<{ tab: Tab, selected: boolean }> = (props) => {
  return <Switch>
    <Match when={props.selected}> <a class="inline-flex items-center border-b-2 border-indigo-500 px-1 pt-1 text-sm font-medium text-gray-900">{props.tab.name}</a></Match>
    <Match when={!props.selected}> <A href={props.tab.route} class="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700">{props.tab.name}</A></Match>
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

export function H2(props: { children: JSXElement }) {
  return <h4 class="pt-4 pb-2 text-2xl font-bold dark:text-white">{props.children}</h4>
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