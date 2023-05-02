GRANT USAGE ON SCHEMA mg TO mangrove;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA mg TO mangrove;

drop table if exists mg.db cascade;
drop table if exists mg.segment cascade;
drop table if exists mg.org cascade;
drop table if exists mg.credential;
drop table if exists mg.org_member cascade;
drop table if exists mg.device_org cascade;
drop table if exists mg.device cascade;
drop table if exists mg.org_db cascade;
drop table if exists mg.dbstream cascade;
drop table if exists mg.dblock cascade;
drop table if exists mg.dbentry cascade;
drop table if exists mg.org_member;
