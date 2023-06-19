

// this could eventually moved to shared array buffer

// serialize instructions to a buffer
// for each site.server there is a log

// operations
// table, primary key, attr, id, ins, del, replace, load,
// store potentially


// inside of that we write op=table,primarykey, attr, o

enum Op {
    Table = 1,
    PrimaryKey,
    Attr,
    Id,
    Ins,
    Del,
    Replace,
    Load,
}

class Reader {

}

// we need to be able read and rewrite the tail of the log to reach consensus on ordering
class Writer {
    b = new Uint8Array(16384)
    all : Uint8Array[] = []
    pos = 0
    te = new TextEncoder()

    emit(op: number){

    }
    emitstr(op: string){

    }
    emitb(data: Uint8Array) {

    }
    writeOp(op: number ){
        this.b[this.pos++] = op

    }
    
    
}