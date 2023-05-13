
home is an interface for the user's metabase.

Like finder or explorer, lets you browse the databases you are connected with. Each database is displayed in an iframe sandbox, allowing the database to customize its user interface.


the metabase is for a list of databases and access to user settings.

a database is referred to by it's public key.

devices are referred to by their public key. When a user receives a secret key on one device, that device then envelopes the key to all the other devices. 

Encryption and access decisions are up to the storage server. No plaintext private keys are stored in the metabase. 

