
home is an interface for the user's metabase.

Like finder or explorer, lets you browse the databases you are connected with. Each database is displayed in an iframe sandbox, allowing the database to customize its user interface.


the metabase is for a list of databases and access to user settings.

a database is referred to by it's public key.

devices are referred to by their public key. When a user receives a secret key on one device, that device then envelopes the key to all the other devices. 

Encryption and access decisions are up to the storage server. No plaintext private keys are stored in the metabase. 

 it can import a list of user sites to show updates?
 ultimate the host (maybe datagrove.com) decides what code can be used
 but the creator must be able to configure plugins
 guests need protection from these plugins, they need to appear in iframes.
 even guests will be logged in and have an account? That's not good for seo
 we need a way for bots to view sites.

sites that are public need to have custom addresses.
these need to be fully static, generated from the core site (e.g. astro)
can we host these with r2? Pages is going to be painful to scale.

all plugins will need to support static/island generation including necessary iframes.

background build for the organization. (time delay?)
probably best thing is to post updates to a shadow site, then tag and publish it.
shadow site can simply be snapshots made with tags allowed.


/org/partition/branch/...path

/org 
/org/partition





