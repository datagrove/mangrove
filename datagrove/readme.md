there is a server-wide home page that can be configured
by default there should be a site for docs

For the home page to run it should download these server wide links
It should provide templates for onboarding users

in general templates should be in a template directory off from home
sites directories will all be numeric, so any name is ok

Login Page

1. Accept user and password or passkey
2. Login in with user and password
3. If successful without passkey, ask if they would like to add a second factor, or require it.

Registration Page

Admin page

Allowable second factors
[ ] Passkey alone (recommended)
[ ] Passkey + Password
[ ] SMS factor
[ ] Email factor
[ ] Authenticator App
[ ] Phone app

[ ] Second factor required

# Cli commands

_assumes_ you have set up id with keygen and pasted the public key into your datagrove security settings.

potentially we could use this approach to offer an sftp interface to r2.

dg sftp datagrove.net:/<Site>/folder ~/tofolder
dg sftp ~/fromfolder user@datagrove.net:/<SITE>/folder

dg build <SITE>

<SITE> maybe DID or a display name

we could access the site at the same <SITE>.datagrove.net/en/~tool
but this assumes that we serve all our code like that and move it around.
it might be simpler to just log into datagrove to edit?
safety matters though, can we use an anonymous iframe as isolation for just the viewer?
isn't an editor potentially dangerous as well though?
