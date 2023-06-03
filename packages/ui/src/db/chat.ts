import { faker } from "@faker-js/faker"
import { Author, Message } from "./data"

// special hand coding for important application.

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
