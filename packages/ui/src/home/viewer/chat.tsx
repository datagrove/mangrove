// one cell width
// potentially multiple columns if the screen is wide enough
// if clicking a thread in column x, default to opening in column x+1?
// probably use vscode way of explicit splittings

import { createEffect } from "solid-js"
import { Column, Scroller, ScrollerProps, TableContext } from "../../editor/scroll"
import { faker } from "@faker-js/faker"

export interface Message {
    text: string
    avatarUrl: string
    user: string
    date: string
}
export function ChatViewer() {
    const chats: Message[] = []
    for (let i = 0; i < 100; i++) {
        chats.push({
            text: faker.lorem.paragraph(),
            avatarUrl: "https://avatars.githubusercontent.com/u/1000000?s=60&v=4",
            user: faker.name.fullName(),
            date: faker.date.recent().toLocaleDateString(),
        },
        )
    }
    let el: HTMLDivElement | null = null
    createEffect(() => {
        const cm = new Map<number, Column>()
        let opts: ScrollerProps = {
            container: el!,
            row: {
                count: chats.length,
            },
            builder: function (ctx: TableContext): void {
                const o: Message = chats[ctx.row]
                ctx.render(<MessageWithUser message={o} />)
            }
        }
        let ed = new Scroller(opts)
    })
    return <div class='absolute top-0 left-0 right-0 bottom-0 overflow-auto' ref={el!} />
}



//   type ImageProps = { src, sizes, unoptimized, priority, loading, lazyBoundary, class, quality, width, height, objectFit, objectPosition, onLoadingComplete, loader, placeholder, blurDataURL, ...all }:
function Image(props: any) {
    return <img {...props} />
}

function MessageWithUser(props: { message: Message }) {
    return (
        <div class="flex py-0.5 pr-16 pl-4 mt-[17px] leading-[22px] hover:bg-gray-950/[.07]">
            <div class="overflow-hidden relative mt-0.5 mr-4 w-10 min-w-fit h-10 rounded-full">
                <Image
                    placeholder="blur"
                    layout="fixed"
                    class="mt-0.5 mr-4 w-10 h-10 rounded-full"
                    height={40}
                    width={40}
                    src={props.message.avatarUrl}
                    alt={props.message.user}
                    blurDataURL={props.message.avatarUrl}
                />
            </div>
            <div>
                <p class="flex items-baseline">
                    <span class="mr-2 font-medium text-green-400">
                        {props.message.user}
                    </span>
                    <span class="text-xs font-medium text-gray-400">
                        {props.message.date}
                    </span>
                </p>
                <p class="text-gray-100">{props.message.text}</p>
            </div>
        </div>
    )
}

export type MessageProps = {
    message: {
        text: string
    }
}

function Message({ message }: MessageProps) {
    return (
        <div class="py-0.5 pr-16 pl-4 leading-[22px] hover:bg-gray-950/[.07]">
            <p class="pl-14 text-gray-100">{message.text}</p>
        </div>
    )
}
