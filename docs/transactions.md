
process fsnotify events per file, or simply sweep the directory?

propose
1. send a signal to a channel. this serializes access to the directories.
2. the channel then sweeps all the directories.
3. write beginSweep( fileList->uuid )
4. move the files to a temp directory with uuid names
5. delete the beginSweep
6. process

To recover
redo all the beginSweep operations (some will fail, file already moved)
delete the beginSweep
process



