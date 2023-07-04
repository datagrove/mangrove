// user settings should be a resource since they are loaded asynchronously.
// we can fetch locally then merge with the remote settings.
// const fetchUser = async (did: string): Promise<UserSettings> => {
//   // how this going to get the user did? cookie? localstorage? shared worker?
//   return {
//     tools: ["alert"]
//     pindm: [],
//     pin
//   }
// }
// const useLogin = () => createResource("", fetchUser)

import { createStore } from "solid-js/store"

// note that a branch and a database are the same thing
// simply fork the database.
// a tag is a timestamp of a database.

// user settings need to be a context, loaded from the home database
// we can probably restore these fastest from a shared worker

// nested reactivity?
export interface UserSettings {
  tools: string[]
  pindm: string[]
  pindb: string[]
  recentdb: string[]
}

export const anon: UserSettings = {
  tools: [
    "site",
    "search",
    "dm",

    "pindm",
    "pindb",
    "settings", // setting is similar to home database
  ],
  pindm: [],
  pindb: [],
  recentdb: []
}

export interface UserState {
  settings: UserSettings,
  counters: {
    [key: string]: number
  }
}
const userState: UserState = {
  settings: anon,
  counters: {}
}
// user becomes a proxy, every field of user is reactive
export const [user, setUser] = createStore<UserState>(userState)
