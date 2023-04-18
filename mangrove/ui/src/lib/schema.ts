import { Pt } from './db'

export interface Dbref {
    name: string[]
}
export const dbref : Pt<Dbref> = {ptn: "dbref"}

 interface Dash {
    job: Job[]
    runnable: Runnable[]
    history: SearchEntry[]
}
export const dash : Pt<Dash> = {ptn: "dash"}

interface JobView {
    title: string
}
var jv: JobView = { title: 'Job View' }

interface Job {
    name: string
    description?: string
    schema?: string
}
interface Runnable {
    name: string
    args?: string
    next?: number // unix time
}
// each search entry covers a time range
interface SearchEntry {
    id: string
    name: string
    summary: string
    type: string
    start: number // unix time
    end: number
}

// return 100 most recent runs, link for more
// searching should be done for all databases
// dry run would be a good feature


interface JobEntry extends SearchEntry {
    task: TaskEntry[]
}
export const jobEntry : Pt<JobEntry> = {ptn: 'jobEntry'}


export interface TaskEntry {
    start: number
    end: number
    name: string
    output: string
}

// this is a bit of a mess, but it's a start
export interface TaskEntry {

}
interface Storage {
    token: string
}
interface Account {
    name: string
    email: string
    database: string[]
}
