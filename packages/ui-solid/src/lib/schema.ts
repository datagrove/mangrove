import { Pt } from './db'

export interface Dbref {
    name: string
}
export const dbref : Pt<Dbref> = {table: "dbref"}
interface JobView {
    title: string
}
export const  jobView: Pt<JobView> = { table: 'JobView' }

// jobs are just json files (or even empty) in /bin directory
// runnables are jsonc commands in the /script directory that begin with //{job}
/*
interface Job {
    name: string
    description?: string
    schema?: string
}
export const job: Pt<Job,{}> = { ptn: 'Job' }

export interface Runnable {
    name: string
    args?: string
    next?: number // unix time
}
export const runnable: Pt<Runnable,{}> = { ptn: 'Runnable' }
*/

export interface File {
    path: string
    created: number
    modified: number
    size: number
}
export const  fileEntry: Pt<SearchEntry,{}> = { table: 'FileEntry' }
// each search entry covers a time range create/modified
export interface SearchEntry extends File {
    summary: string
    type: string   // we can identify this at index time.
}
export const  searchEntry: Pt<SearchEntry,{}> = { table: 'SearchEntry' }

// return 100 most recent runs, link for more
// searching should be done for all databases
// dry run would be a good feature
export interface TaskEntry {
    start: number
    end: number
    name: string
    output: string
}
export const taskEntry: Pt<TaskEntry> = { table: 'TaskEntry' }

interface Storage {
    token: string
}
export const storage: Pt<Storage> = { table: 'Storage' }
interface Account {
    name: string
    email: string
}
export const account: Pt<Account> = { table: 'Account' }