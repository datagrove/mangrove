

// https://diataxis.fr/

import { Page, SiteStore, SearchResult } from "../../layout/store"

// the menu must be translated along with the rest of the interface?
// there are some things which will be general to all of datagrove
// some things that are are site-wide, and some things which are page specific.
// we can load here in a way that preserves english entries if there is no corresponding spanish one.


// there might be sections of the reference site that only make sense if you are logged
// most sites are going to be guide/reference duality


export const REFERENCE_SECTIONS = [
  {
    name: "Concepts",
    children: [
      {
        name: "Reactivity",
        children: [
          {
            name: "Reactivity Basics",
            path: "/references/concepts/reactivity",
          },
          { name: "Tracking", path: "/references/concepts/tracking" },
        ],
      },
    ],
  },
  {
    name: "API",
    children: [
      {
        name: "API Reference",
        children: [{ name: "Coming Soon", path: "/references/api-reference" }],
      },
    ],
  },
]

export const GUIDES_SECTIONS = [
  {
    name: "Tutorials",
    children: [
      {
        name: "Getting Started with Solid",
        // navigating to /guides/getting-started-with-solid takes you to /guides/getting-started-with-solid/welcome
        children: [
          {
            name: "Welcome",
            path: "/guides/tutorials/getting-started-with-solid/welcome",
          },
          {
            name: "Installing Solid",
            path: "/guides/tutorials/getting-started-with-solid/installing-solid",
          },
          {
            name: "Building UI with Components",
            path: "/guides/tutorials/getting-started-with-solid/building-ui-with-components",
          },
          {
            name: "Adding Interactivity with State",
            path: "/guides/tutorials/getting-started-with-solid/adding-interactivity-with-state",
          },
          {
            name: "Control Flow",
            path: "/guides/tutorials/getting-started-with-solid/control-flow",
          },
          {
            name: "Fetching Data",
            path: "/guides/tutorials/getting-started-with-solid/fetching-data",
          },
        ],
      },
    ],
  },
  {
    name: "How-To Guides",
    children: [
      {
        name: "Get Ready for Solid",
        children: [
          {
            name: "Welcome",
            path: "/guides/how-to-guides/get-ready-for-solid/",
          },
          {
            name: "Installation & Setup",
            path: "/guides/how-to-guides/get-ready-for-solid/installation-and-setup",
          },
          {
            name: "Linting",
            path: "/guides/how-to-guides/get-ready-for-solid/linting",
          },
        ],
      },
      {
        name: "Styling In Solid",
        children: [
          {
            name: "Introduction",
            path: "/guides/how-to-guides/styling-in-solid",
          },
          {
            name: "CSS Modules",
            path: "/guides/how-to-guides/styling-in-solid/css-modules",
          },
          {
            name: "Sass",
            path: "/guides/how-to-guides/styling-in-solid/sass",
          },
          {
            name: "Less",
            path: "/guides/how-to-guides/styling-in-solid/less",
          },
          {
            name: "Tailwind CSS",
            path: "/guides/how-to-guides/styling-in-solid/tailwind-css",
          },
          {
            name: "UnoCSS",
            path: "/guides/how-to-guides/styling-in-solid/unocss",
          },
          {
            name: "WindiCSS",
            path: "/guides/how-to-guides/styling-in-solid/windicss",
          },
        ],
      },
      {
        name: "Comparison",
        children: [
          {
            name: "Vue",
            path: "/guides/how-to-guides/comparison/vue",
          },
        ],
      },
    ],
  },
]

export const siteStore: SiteStore = {
  title: "Datagrove",
  href: "https://www.datagrove.com",
  root: { name: "/", path: "/", children: [] } as Page,
  path: new Map<string, Page>(),
  search: [],
  sitemap: [
    {
      name: 'Guides', // needs to be localized
      // we shouldn't have a path to sections, we just pick the first child
      children: GUIDES_SECTIONS,
    },
    {
      name: 'Reference',
      children: REFERENCE_SECTIONS,
    }
  ],
  language: {
    en: 'English',
    es: 'Español',
  }
}

