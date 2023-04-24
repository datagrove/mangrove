import { Icon } from "solid-heroicons"
import { chevronRight } from "solid-heroicons/solid"
import { createSignal, For, Show } from "solid-js"
import { usePageState } from "./prevnext"
import './toc2.css'

// https://codepen.io/lisilinhart/pen/NWrrNpV
interface Head {
    title: string
    depth: number
    id: string
}
export function generateLinkMarkup($headings: HTMLElement[]) {
    const parsedHeadings = $headings.map(heading => {
        return {
            title: heading.innerText,
            depth: parseInt(heading.nodeName.replace(/\D/g, '')),
            id: heading.getAttribute('id')
        }
    })
    // use jsx here for better typing?
    const htmlMarkup = parsedHeadings.map(h => `
      <li class="dark:hover:text-white hover:underline header-link ${h.depth > 1 ? 'pl-4' : 'pl-2'}">
          <a class="" href="#${h.id}">${h.title}</a>
      </li>
      `)
    const finalMarkup = `
          <ul class=' leading-6'>${htmlMarkup.join('')}</ul>
      `
    return finalMarkup
}

function updateLinks(visibleId: string, $links: HTMLElement[]) {
    $links.map(link => {
        let href = link.getAttribute('href')
        link.classList.remove('is-active')
        if (href === visibleId) link.classList.add('is-active')
    })
}

function handleObserver(entries: any[], observer: any, $links: HTMLElement[]) {
    entries.forEach((entry: any) => {
        const { target, isIntersecting, intersectionRatio } = entry
        if (isIntersecting && intersectionRatio >= 1) {
            const visibleId = `#${target.getAttribute('id')}`
            updateLinks(visibleId, $links)
        }
    })
}

function createObserver($links: HTMLElement[]) {
    const options = {
        rootMargin: "0px 0px -200px 0px",
        threshold: 1
    }
    const callback: IntersectionObserverCallback = (e, o: IntersectionObserverInit) => handleObserver(e, o, $links)
    return new IntersectionObserver(callback, options)
}

export function buildToc(contentDiv: HTMLElement, $aside: HTMLElement) {
    const $headings: Element[] = [...contentDiv.querySelectorAll('h1, h2')];
    const linkHtml = generateLinkMarkup($headings as HTMLElement[]);
    $aside.innerHTML = linkHtml

    const $links = [...$aside.querySelectorAll('a')]
    const observer = createObserver($links)
    $headings.map(heading => observer.observe(heading))
}

// Summary can be at the top of the page, collapsed, or at the side if screen is wide enough
export function Summary(props: { collapsed?: boolean }) {
    const { sections } = usePageState()!;
    const [collapsed, setCollapsed] = createSignal(props.collapsed || false);

    return (
        <div class="mb-4 py-2 px-4 text-neutral-400 dark:bg-solid-dark border border-solidlightitem rounded-md dark bg-solid-light z-50 ">
            <button
                onClick={() => setCollapsed((prev) => !prev)}
                aria-controls="preferences"
                type="button"
                class="w-full  flex items-center justify-between md:pointer-events-none"
            >
                Summary
                <Icon path={chevronRight} class='w-6 h-6' />
            </button>
            <Show when={!collapsed()}>
                <ol class="mt-2 list-none space-y-1">
                    <For each={sections()}>
                        {(item, index) => (
                            <li class="text-base py-2 flex items-center gap-2 rounded hover:bg-solid-light hover:dark:bg-solid-darkbg px-2">

                                <a class="font-semibold" href={"#" + item.href}>
                                    {item.title}
                                </a>
                            </li>
                        )}
                    </For>
                </ol>
            </Show>
        </div>
    )
}




