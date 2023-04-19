import { Pt } from './db'

export interface Dbref {
    name: string
}
export const dbref : Pt<Dbref> = {ptn: "dbref"}
interface JobView {
    title: string
}
export const  jobView: Pt<JobView> = { ptn: 'JobView' }

interface Job {
    name: string
    description?: string
    schema?: string
}
export const job: Pt<Job> = { ptn: 'Job' }

interface Runnable {
    name: string
    args?: string
    next?: number // unix time
}
export const runnable: Pt<Runnable> = { ptn: 'Runnable' }

// each search entry covers a time range
interface SearchEntry {
    id: string
    name: string
    summary: string
    type: string
    start: number // unix time
    end: number
}
export const  searchEntry: Pt<SearchEntry> = { ptn: 'SearchEntry' }

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
export const taskEntry: Pt<TaskEntry> = { ptn: 'TaskEntry' }

interface Storage {
    token: string
}
export const storage: Pt<Storage> = { ptn: 'Storage' }
interface Account {
    name: string
    email: string
}
export const account: Pt<Account> = { ptn: 'Account' }