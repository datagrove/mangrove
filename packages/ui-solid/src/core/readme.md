// the url is a function invocation. If it has all the arguments provided then we show the value of the function, otherwise we show the function itself (template=function)
// the language argument is problematic - does it choose the function, or is it a parameter to the function? Or both?
// we can get rid of the tool altogether and make it local state.
// {owner.host} /site/function/en/
// 


does it make sense to use wildcard dns to get some isolation, but then we also have service worker per? The service worker can potentially use dynamic modules assembled in the browser to keep them cached?

language should be in a standard spot, so we can use it in our interface? or maybe the interface language should stay constant (local storage).

// this can't read data from any other customer, that's not necessarily a good thing.
are we going to have a security probablem we are trying to solve here? what code are we going to execute from the page? Even css is turing complete. Can we show page without executing the code? 

what if we fork it into our own ownership? Is that what we are normally doing anyway?


customer.datagrove.com/site/function/en/

-- fork
me.datagrove.com/site.customer/function/en

i could use vm type sandboxes - best overall?

sandbox-me.datagrove.com

this isolates the site, but can my identity be abused? contact databases not in this sandbox? 

