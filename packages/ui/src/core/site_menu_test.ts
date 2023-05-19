

// this is the structure of an org site as seen by the owner


// most of this needs to get built from a database. it should work offline and get synced
export const orgsite = {
  "title": "Anonymous",
  "href": "",
  "root": {
    "name": "/",
    "path": "/",
    "children": []
  },
  defaultLanguage: "en",
  "sitemap": [
    {
      "name": "Tasks",
      "children": [
        {
          "name": "Websites",
          "path": "/en/jim.hurd",
          "children": [
            {
              "name": "Recent",
              "path": "/en/jim.hurd",
              "children": [
                {
                  "name": "Tutorial",
                  "path": "/en/jim.hurd"
                }
              ]
            },
            {
              "name": "All",
              "path": "/en/jim.hurd",
              "children": [
                {
                  "name": "Tutorial",
                  "path": "/en/jim.hurd"
                }
              ]
            }
          ]
        },

      ]
    },
    {
      "name": "Learn",
      "children": [
        {
          "name": "Explanation",
          "path": "/en/jim.hurd",
          "children": [
            {
              "name": "Process Files",
              "path": "/en/jim.hurd",
              "children": [
                {
                  "name": "All Files",
                  "path": "/en/jim.hurd"
                }
              ]
            }
          ]
        },
        {
          "name": "How-to",
          "path": "/en/jim.hurd",
          "children": [
            {
              "name": "Process Files",
              "path": "/en/jim.hurd",
              "children": [
                {
                  "name": "All Files",
                  "path": "/en/jim.hurd"
                }
              ]
            }
          ]
        },
        {
          "name": "Tutorials",
          "path": "/en/jim.hurd",
          "children": [
            {
              "name": "Process Files",
              "path": "/en/jim.hurd",
              "children": [
                {
                  "name": "All Files",
                  "path": "/en/jim.hurd"
                }
              ]
            }
          ]
        },
        {
          "name": "Reference",
          "path": "/en/jim.hurd",
          "children": [
            {
              "name": "Security",
              "path": "/en/jim.hurd",
              "children": [
                {
                  "name": "Login",
                  "path": "/en/jim.hurd"
                },
                {
                  "name": "Recover",
                  "path": "/en/jim.hurd"
                },
                {
                  "name": "Register",
                  "path": "/en/jim.hurd"
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  "language": {
    "en": "English",
    "es": "Español"
  }
}