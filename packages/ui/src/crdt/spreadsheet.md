

To insert a row into a spreadsheet we generate a gid and insert it into the consensus vector. 

To create a cell, we have a table 
(ss_rowid, sheet_gid, cell_gid, row_gid, contents)

create table spreadsheet( row_vector, column_vector )

create table spreadsheet_cell( )


How does this work when we nest? Spreadsheets in documents, documents in spreadsheets?

Here linking and embedding are identical; everything is embedded in the database

link("table", gid)

inside a lexical document we have tables (or prefer our own embeds)

create table document(text)
// not really, but conceptually?
create table document_format(start, end, tag )

embedTable( 999,999, ('table', rowid))

