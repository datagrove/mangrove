
import { NavLink } from "@solidjs/router";
import { Icon } from "solid-heroicons";
import { chevronRight } from "solid-heroicons/solid";

// collapsible is too aggressive initially. we want to stop at 3 levels
// solid docs use an hr, but general design principal is to avoid this if not needed? e.g. how to make a perfect table

import { Show, createSignal, ParentProps, createUniqueId, JSX } from "solid-js";


export function CollapsedIcon(props: {class: string}) {
  return <div class={"duration-100 ease-in transition" + props.class}>▼</div>;
}

type CollapsibleProps = ParentProps<{
  startCollapsed?: boolean;
  header: string;
}>;

export function Collapsible(props: CollapsibleProps) {
  const [collapsed, setCollapsed] = createSignal(props.startCollapsed || false);

  const id = createUniqueId();

  return (
    <li value={props.header} class="ml-2">
      <SectionHeader
        collapsed={collapsed()}
        onClick={() => setCollapsed((prev) => !prev)}
        panelId={id}
      >
        {props.header}
      </SectionHeader>
      <Show when={!collapsed()}>
        <SectionPanel id={id}>{props.children}</SectionPanel>
      </Show>
    </li>
  );
}

export function SectionHeader(
  props: ParentProps<{
    collapsed: boolean;
    panelId: string;
    onClick: () => void;
  }>
) : JSX.Element {
  return (
    <h3 >
      <button
        class="w-full text-solid-dark dark:text-solid-light text-left  flex items-center justify-between py-2"
        onClick={props.onClick}
        // aria-expanded={!props.collapsed}
        // aria-controls={props.panelId}
      >
        {props.children}
        <Icon path={chevronRight}
          class={`transition w-6 h-6 text-solid-lightaction dark:text-solid-darkaction transform ${
            !props.collapsed ? "rotate-90" : ""
          }`}
        />
      </button>
    </h3>
  );
}

function SectionPanel(props: ParentProps<{ id: string }>) {
  return (
    <ul
      id={props.id}
      class="opacity-100 md:border-l border-solid-lightitem dark:border-solid-darkitem"
      style="list-none transition: opacity 250ms ease-in-out 0s; animation: 250ms ease-in-out 0s 1 normal none running nav-fadein;"
    >
      {props.children}
    </ul>
  );
}


export function NavItem(props: {children: JSX.Element, href: string, title: string}) {
  return (
    <li>
      <NavLink
        class="p-2 text-base w-full rounded-r-xl rounded-l-none text-left relative flex items-center justify-between transition"
        {...props}
        inactiveClass="hover:bg-solid-light hover:dark:bg-solid-darkbg"
        activeClass="text-white font-semibold bg-solid-accent active"
        end={true}
      >
        {props.children}
      </NavLink>
    </li>
  );
}
