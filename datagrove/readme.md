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

dg sftp user@<SITE>.datagrove.net:/folder ~/tofolder
dg sftp ~/fromfolder user@<SITE>.datagrove.net:/folder
dg build <SITE>

<SITE> maybe DID or a display name

we could access the site at the same <SITE>.datagrove.net/en/~tool
