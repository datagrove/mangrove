import { faker } from "@faker-js/faker"

// special hand coding for important application.

export interface Author {
    id: number
    avatarUrl: string    
    username: string
    display: string // can change in the forum
}
export interface Reaction {
    author: number
    emoji: string
}
export interface Attachment {
    type: string
    url: string
}
export interface MessageData {
    id: number
    authorid: number
    text: string
    replyTo: number
    daten: number
}

// rollup after join. maybe this should be a chat group
// allows bubble formatting like signal
export interface Message extends MessageData{
    author: Author
    date: string
    reactions: Reaction[]
    attachment: Attachment[]
}

async function author(id: number) : Promise<Author> {
    return {
        id: id,
        username: faker.internet.userName(),
        display: faker.person.fullName(),
            avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",        
    }
}

async function fake() : Promise<Message[]> {
    const chats: Message[] = []
    for (let i = 0; i < 100; i++) {
        chats.push({
            text: faker.lorem.paragraph(),
            author: await author(i % 3),
            date: faker.date.recent().toLocaleDateString(),
            reactions: [],
            attachment: [],
            id: 0,
            authorid: 0,
            replyTo: 0,
            daten: 0
        })     
    }
    return chats
}
