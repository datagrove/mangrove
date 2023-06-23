

background fetch is different from push.

push will generally be initiated by the client, with @everyone, @user, 

TxAlert {
    LogId
    UserId[]
    Summary

}

// note that each Device has a different sync state
Sync {
    DeviceId
    Online
}


is there a strategy that allows this to efficiently
1. Online to one or all devices
2. Batching push notifications according to the available capacity granted


do this in each shard, when going online user will broadcast request and get response from each peer
(clearing database and setting online status)

if online then 

create table(logid primary, length) 

create table(logid, deviceid, primary(logid, deviceid))

select limit 500
order by rowid

delete where rowid < x and

start with time for the row id, increment




