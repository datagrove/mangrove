
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