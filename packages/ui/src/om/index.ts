
// based on google/raph levien's toy ot under apache license
// here are using it to order a vector of unique keys (distributed order maintenance problem?). We could also use RGA, but let's try this.

// the ordering itself needs to be kept in a table cell. 



// a sparse set of integers.
interface Tree {
	left: Tree | null;
	right: Tree | null;
	value: number;
	size: number;
	height: number;
}

function size_of(tree: Tree | null): number {
	return tree == null ? 0 : tree.size;
}

function xi(tree: Tree | null, i: number): number {
	let base = 0;
	while (tree != null) {
		const left = tree.left;
		const x = tree.value - size_of(left);
		if (i < x) {
			tree = left;
		} else {
			i = 1 + i - x;
			base += tree.value;
			tree = tree.right;
		}
	}
	return base + i;
}

// precondition: i is not a member of the set
function xi_inv(tree: Tree | null, i: number) {
	var result = i;
	var x = 0;
	while (tree != null) {
		if (i < tree.value) {
			tree = tree.left;
		} else {
			i -= tree.value;
			result -= size_of(tree.left) + 1;
			tree = tree.right;
		}
	}
	return result;
}

function contains(tree: Tree | null, i: number) {
	while (tree != null) {
		if (i < tree.value) {
			tree = tree.left;
		} else if (i == tree.value) {
			return true;
		} else { // i > tree.value
			i -= tree.value;
			tree = tree.right;
		}
	}
	return false;
}

function mk_tree_raw(left: Tree | null, value: number, right: Tree | null) {
	var size = size_of(left) + 1 + size_of(right);
	var left_height = left == null ? 0 : left.height;
	var right_height = right == null ? 0 : right.height;
	var height = Math.max(left_height, right_height) + 1;
	return { left: left, value: value, right: right, size: size, height: height };
}

function mk_tree(left: Tree | null, value: number, right: Tree | null) {
	var left_height = left == null ? 0 : left.height;
	var right_height = right == null ? 0 : right.height;
	if (left_height > right_height + 1) {
		// unbalanced, rotate right
		var new_right = left != null ? mk_tree_raw(left.right, value - left.value, right) : null;
		return left != null ? mk_tree_raw(left.left, left.value, new_right) : null;
	} else if (right_height > left_height + 1) {
		// unbalanced, rotate left
		var new_left = right != null ? mk_tree_raw(left, value, right.left) : null;
		return right != null ? mk_tree_raw(new_left, value + right.value, right.right) : null;
	}
	return mk_tree_raw(left, value, right);
}

function union_one(tree: Tree | null, i: number): Tree | null {
	if (tree == null) {
		return mk_tree(null, i, null);
	} else if (i < tree.value) {
		var left_union: Tree | null = union_one(tree.left, i);
		return mk_tree(left_union, tree.value, tree.right);
	} else if (i == tree.value) {
		return tree;
	} else {  // i > tree.value
		var right_union: Tree | null = union_one(tree.right, i - tree.value);
		return mk_tree(tree.left, tree.value, right_union);
	}
}

// \Xi_{i}(S)
function xi_one(tree: Tree | null, i: number): Tree | null {
	if (tree == null) {
		return null;
	} else if (i <= tree.value) {
		var left_seq: Tree | null = xi_one(tree.left, i);
		return mk_tree(left_seq, tree.value + 1, tree.right);
	} else {
		var right_seq: Tree | null = xi_one(tree.right, i - tree.value);
		return mk_tree(tree.left, tree.value, right_seq);
	}
}


// for debugging
function to_array(tree: Tree | null) {
	var result: number[] = [];
	function rec(tree: Tree | null, base: number) {
		if (tree != null) {
			rec(tree.left, base);
			base += tree.value;
			result.push(base);
			rec(tree.right, base);
		}
	}
	rec(tree, 0);
	return result;
}

function tree_toy() {
	let tree: Tree | null = null;
	tree = union_one(tree, 7);
	tree = union_one(tree, 2);
	tree = union_one(tree, 0);
	tree = union_one(tree, 2);
	tree = union_one(tree, 3);
	for (var i = 200; i > 100; i--) {
		tree = union_one(tree, i);
	}
	console.log(to_array(tree));
	console.log(tree?.size, tree?.height);
	for (var i = 0; i < 10; i++) {
		console.log(i, xi(tree, i), xi_inv(tree, xi(tree, i)), contains(tree, i));
	}
	console.log(to_array(xi_one(tree, 5)));
}

//tree_toy();

// transformations of operations
// All operations have 'ty' and 'ix' properties
// also 'id'
// sample operations:
// {ty: 'ins', ix: 1, ch: 'x', pri: 0}
// {ty: 'del', ix: 1}

// can we break ties based on the keys themselves? pri is tricky to manage.
export interface Op {
	ty: string;
	ix: number;
	pri?: number; // priority is a tiebreaker for ins operations, session id.
	keys?: string[];
	id: number;
}

// Note: mutating in place is appealing, to avoid allocations.
function transform(op1: Op, op2: Op): Op {
	if (op2.ty != 'ins') { return op1; }
	return transform_ins(op1, op2.ix, op2.pri ?? 0);
}

function transform_ins(op1: Op, ix: number, pri: number) {
	if (op1.ty == 'ins') {
		if (op1.ix < ix || (op1.ix == ix && (op1.pri ?? 0 < pri))) {
			return op1;
		}
		return { ty: op1.ty, ix: op1.ix + 1, ch: op1.keys, pri: op1.pri, id: op1.id };
	} else { // op1.ty is del
		if (op1.ix < ix) {
			return op1;
		}
		return { ty: op1.ty, ix: op1.ix + 1, id: op1.id };
	}
}

export class DocState {
	ops: Op[];
	dels: Tree | null;
	str: string;
	points: number[];  // in user-visible string coordinates
	constructor() {
		this.ops = [];
		this.dels = null;
		this.str = "";
		this.points = [];  // in user-visible string coordinates
	}

	add(op: Op) {
		this.ops.push(op);
		if (op.ty == 'del') {
			if (!contains(this.dels, op.ix)) {
				var ix = xi_inv(this.dels, op.ix);
				this.dels = union_one(this.dels, op.ix);
				this.str = this.str.slice(0, ix) + this.str.slice(ix + 1);
				for (var i = 0; i < this.points.length; i++) {
					if (this.points[i] > ix) {
						this.points[i] -= 1;
					}
				}
			}
		} else if (op.ty == 'ins') {
			this.dels = xi_one(this.dels, op.ix);
			var ix = xi_inv(this.dels, op.ix);
			this.str = this.str.slice(0, ix) + op.keys + this.str.slice(ix);
			for (var i = 0; i < this.points.length; i++) {
				if (this.points[i] > ix) {
					this.points[i] += 1;
				}
			}
		}
	}

	xform_ix(ix: number) {
		return xi(this.dels, ix);
	}

	get_str() {
		return this.str;
	}
}

export class OtPeer {
	rev: number;
	context: Set<number>;
	constructor() {
		this.rev = 0;
		this.context = new Set();
	}

	merge_op(doc_state: DocState, op: Op) {
		var id = op.id;
		var ops = doc_state.ops;
		if (this.rev < ops.length && ops[this.rev].id == id) {
			// we already have this, roll rev forward
			this.rev++;
			while (this.rev < ops.length && this.context.has(ops[this.rev].id)) {
				this.context.delete(ops[this.rev].id);
				this.rev++;
			}
			return;
		}
		for (var ix = this.rev; ix < ops.length; ix++) {
			if (ops[ix].id == id) {
				// we already have this, but can't roll rev forward
				this.context.add(id);
				return;
			}
		}
		// we don't have it, need to merge
		var ins_list: [number, number][] = [];
		var S = null;
		var T = null;
		for (var ix = ops.length - 1; ix >= this.rev; ix--) {
			var my_op = ops[ix];
			if (my_op.ty == 'ins') {
				var i = xi(S, my_op.ix);
				if (!this.context.has(my_op.id)) {
					ins_list.push([xi_inv(T, i), my_op.pri ?? 0]);
					T = union_one(T, i);
				}
				S = union_one(S, i);
			}
		}
		for (var i = ins_list.length - 1; i >= 0; i--) {
			op = transform_ins(op, ins_list[i][0], ins_list[i][1]);
		}
		var current = (this.rev == ops.length);
		doc_state.add(op);
		if (current) {
			this.rev++;
		} else {
			this.context.add(id);
		}
	}
}






// this will wrap a message channel to a quasi-shared worker, that worker will manage device state and talk to the global counter

// this will be a context shared by entire tab, or maybe just a local wrapper that itself will use a context to get to the worker. eithe way it will be making rpc calls not direct calls

// do we need this to return consecutive ids? can multiple strings use the same serial number, or do we need state for each string? we can get the counter from the worker during addListener.

// holds local document state shared across tabs


// listeners are shared resource; a message channel to the worker
// we can make this recover from a dedicated worker closing directly or we can mediate through a shared worker. Is there noticeable latency in the latter? we can probably even do some direct state management in the shared worker, but we won't have a socket there, only a message channel to the leader's dedicated worker.

// this could keep a map of collab editors, then panes would always get the same one.






interface UpdateOrder{
    version:  number
    device: string
    op: number[]
    at: number[]
    keys: string[]
}
function compose(u: UpdateOrder[]) : UpdateOrder {
    return u[0]
}

class Listener {
    listener = new Set<()=>void>()
    add(l: ()=>void) {
        this.listener.add(l)
    }
    remove(l: ()=>void) {
        this.listener.delete(l)
    }
    notify() {
        for (const l of this.listener) {
            l()
        }
    }
}

interface Ordering {
    version: number
    keys: string[]
}

interface OrderKeeper {
    read(from: number) : Promise<[Ordering,number]>
    //if the socket breaks the status of the proposal is undefined.
    // maybe then we should return void?
    propose(u: UpdateOrder) : Promise<boolean|undefined>
}
class OrderedKeys extends Listener  implements OrderKeeper{
    start = 0
    keys : string[] = []


    // I might not know the outcome of a proposal yet, thus nextProposal
    proposal?: UpdateOrder
    nextProposal? : UpdateOrder

    log : UpdateOrder[] = []



    get version() { 
        return this.log.length + this.start
    }

    constructor(public parent?: OrderedKeys) {
        super()
        if (parent) {
            parent.add(()=>this.notify())
        }
    }

    async read(from: number) : Promise<[UpdateOrder,number]> {
        return [compose(this.log.slice(from)), this.version]
    }

    propose(u: UpdateOrder) : boolean{
        if (u.version != this.version) {
            return false
        }


        this.notify()
        return true
    }

}