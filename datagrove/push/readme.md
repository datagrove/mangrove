

is there a strategy that allows this to efficiently
1. Online to one or all devices
2. Batching push notifications according to the available capacity granted


// do this in each shard

create table(logid primary, length) 

create table(logid, deviceid, primary(logid, deviceid))

select limit 500
order by rowid

delete where rowid < x and

start with time for the row id, increment




