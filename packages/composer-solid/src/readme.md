composer is one way to compose a set of datagrove editors together into a common interface.


Each site has an outline. Currently loaded in memory with json, but in the future will move to a database vector.

maybe each page has an outline? each page is a function of the url, the side menu is no exception to that.
so if the site tool is invoked, we should

-- this is also an outline, but it probably is a sorted one?
-- Are these two different types of editors? symlinks
-- one idea is that all outlines are pinned + sorted. Pins are manually ordered.
-- option to view without pins, or only pins. SSG sites might be only pins.
create table settings(
oid,
sites, -- should be vector, for now blob.
)

create table site(
sid, -- 64 bit integer assigned by host of record. offline creation uses negative numbers until one is assigned.
did,
outline,
)

create table page(
sid,
pathn,
path
format
data bytea
)

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

// we might want to access a sitemap here?
// most (all?) of our apps will have a database
// but they can access other databases and servers as well.

// we could be looking at our own home or someone else's home
// it will be somewhat different.

// if its our home, then we will be at
// {ouruser}/en/home
// if it's someone else's home then we will be at
// other/en/home
// here an issue is if the user is anonymous, then we need to use their secret string. we could say that anything shorter than X is a friendly name.

// in general this will be a did, but it could be a friendly name.

// this is the SPA

// we need a database here to determine if we have access to the site
// defaults to home

// one app is login? just configure these in the router though?
// tool = app, we need icon for an app, and then activate that on the tool set.
// the active database can show selected as well, but we can select unpinned databases. maybe add them to the tool set as well (like the dock). one odd thing is top or bottom since they are always shifting. maybe pinned at the top and dynamic at the bottom

// a tool may have to deal with different document types
// the viewer depends on the document type, not the tool

// most long running things can be done in chat
// one odd thing is issues, where conventionally the question comes first and you start at the beginning
// another odd thing is reddit style pages where it is rearranged by votes
// replies are handled differently in these situations
// pins / sticky


1. Each format may enclose { tags }, it may not enclose {tags_not}
2. For given range [start,end] compute the count(start,t[j]), count(stop,t[j])
3. if count(start, t[j]) > 0 for some tag, drop the formt
4. if count(stop)<>count(start) for some tag, drop the format

Rebasing selection
Rebasing text.

this is not an interval tree, just aggregation.
we can aggregate all kinds of tags together: start, stop and then or a type mask together. 

to proceed:
1. start with dirty nodes

