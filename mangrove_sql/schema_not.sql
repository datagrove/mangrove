create table mu.config(
    oid bigint not null primary key, -- only thing can't be encrypted
    settings text,
    sites bytea, 
)

create table mu.page(
    sid bigserial not null, -- site id
    pathn smallint not null, -- path number
    path text not null, -- path string
    format text not null, -- format of page
    data bytea not null,
    primary key (sid, pathn, path)
    foreign key (sid) references mu.site(sid)
)
