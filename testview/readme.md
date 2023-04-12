

# Datagrove TestView

A SFTP and web server for collecting and displaying tests.

Clients can use any sftp library or command to push test artifacts to the testview server. You may view the results as soon as they are pushed. This allows tests sharded over multiple servers to collect their results together in a central database of results.

The first level directory corresponds to the SFTP key being used; typically this might be a "machine user"; a user generated for the purpose of testing. You can generate such a user from test view.

Below the machine user is a test "run". The exact definition of a run is whatever you want it to be, but you may start a run by generating a description of the tests you expect to run in a file named "index.json". This allows the testview user interface to report on progress. (If you are sharding tests, write it from shard 0). 

As the test proceeds, you may use sftp to incrementally save files to testview. If a test restarts, you may use sftp to determine which tests have completed and don't need to be run again.

When the test is completed you may execute a completion command
```
ssh complete shard# shardcount
```


# future work

## mini orchestrator
Use Testview as a mini-orchestrator to run tests on spot instances. This would work by uploading a description of the test images. Then Testview can start and restart spot instances until the test completes or a maximum cost or time.

## e2e encryption

You may encrypt files before writing them to the server. The UI will decrypt them in the browser. A shared testview server will not be able to read the files (but will see file level metadata like filenames, so be aware). When you invite someone to view or contribute to your machine user, their invitation will contain the secret key to view and/or write, so send the invitation over a secure channel such as signal.

## cloud storage










