1. make it as easy as possible for readers, hard as necessary for writers
2. utilize the site host to take record locks; fail the transaction if the tx does  not match the current value. Lock increases by 1 with each successful transaction.


in order to efficiently diff large blobs, we need to keep them as constituent nodes and track the dirty nodes


insert needs a lock; it prevents double insertion. upsert doesn't get us much since our alternate keys will still fail
delete also needs a lock; an out of step delete + insert can give different answers?


readers 
1. get an update, apply it to the shadow copy, diff it to the editor copy. each node has a key, get the node, apply the diff

each node is a list + set.

creating these diffs collaboratively is hard.

1. apply the server diffs, collect dirty nodes
2. diff the dirty nodes
3. try again.

do nodes ever change parents? do they get a new key?

for db:
  user shadow - what the user sees, 

  server shadow - last known server state
   dirty user1 / user2
   dirty 

   memory only
      user shadow2 - older version of what the user sees, proposed to the server
  start up:
     we might have dirty nodes that we want to push to the server
     diff these to create a shadow2
     send changes to the server. 

  server shadow
  user state
    diff,lsn (may resend, lsn can just be 0 or 1)
    throw away when ack success or ack

  we don't need to keep the prior state because we will get it back from the server. On the other hand if we succeed, maybe we take it as the server state.

  server/user
  diff, try 
  If it succeeds, then the user is >= server
  if >, we can start a new diff against the consensus state

 if it fails, then the user is ahead and behind. in this case update the server copy, and do the diff again.

 if the app exits, we still need to retry the diff, it must succeed or fail. the server






  diff, send patch. if it is newest, it works otherwise it is thrown away



  my slightly older map of nodes - 
 
  server map of nodes

  how do we store these maps in a blob or adjuct table?

  nodekey | properties and children

  
in memory
  editor state map of nodes


Element
   Element
     Text
   


keep a shadow copy of the document

when the editor reports a change
1. diff dirty nodes, make steps that when applied to shadow would produce the current document.

try to send those steps to the server
if they succeed we are done

if they fail we will need to get some steps.

get the steps and apply to a canonical document.

use the steps to transform our failed steps, then try again
eventually this succeeds. 

if you have succeeded with al the steps you currently have from the user, then diff back to the user document.