
1. Try ot merge; fail if any insert does not match context on both sides or fails to validate.


fallback merge:
use meyer on words 
reslice marks
add as many tags as don't cause conflicts.


1. Find the element parent. we will "lock" this for the update.
2. Diff from the parent and send a diff with the parent's version number

Note: We may know already that our edits conflict, so jump directly to the merge strategy.

Receiving changes requires mapping points. We must diff the changed elements to update our map so we can do this.
Lexical does some of this for us?

If a proposal fails, then we need to rediff that node.

what if our proposal records the diff range (start/stop), then if we need to retry we can transform the range and try again.

applying the patch is trivial, transforming the unaccepted steps is the hard part.

xml_tree.apply(pos_patch) -> jsonpatch

verson from ls can be (x,y) where x is the buffer version and y is the ls version.

if x > offered then we should be able to apply the patch to the editor.

break the source into pieces with a rolling hash
link the pieces. 
replace the pieces 

can we view a document as set of functions? would this merge better?

