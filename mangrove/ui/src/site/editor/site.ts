import { setSite, Page, SiteStore } from "../../components/site_menu/site_store";

// https://diataxis.fr/

// the menu must be translated along with the rest of the interface?
// there are some things which will be general to all of datagrove
// some things that are are site-wide, and some things which are page specific.
// we can load here in a way that preserves english entries if there is no corresponding spanish one.

// starts expanded top 3
// 1. Guides/ Reference
// 2. Top level section (conceptual/practical)
// 3. Headings within that section
// Everything below that is hidden and needs to be expanded.

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
  ];
  
  export const GUIDES_SECTIONS : Page[] = [
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
  ];
  


// this needs to be set from the tab? should we use location instead?
// for the most part setSite should just set a url, then the datagrove machinery should load the data.

// every site will be named org-site.froov.net/{branch|snapshot|edit|latest}/branch_or_snapshot
// if latest then branch is optional, assumed to be "main"


export function testSite(site: string ){
    setSite({
        ...new SiteStore(),
        root: {
              name: '/',
              path: '/',
              children: [
                {
                  name: 'Guides',
                  // we shouldn't have a path to sections, we just pick the first child
                  children: GUIDES_SECTIONS,
                },
                {
                  name: 'Reference',
                  children: REFERENCE_SECTIONS,
                }
            ]
        },
        language: {
            en: 'English',
            de: 'Deutsch',
            'pt-br': 'Português do Brasil',
            es: 'Español',
            'zh-cn': '简体中文',
            'zh-tw': '正體中文',
            fr: 'Français',
            ar: 'العربية',
            ja: '日本語',
            ru: 'Русский',
        }
        
    })
}