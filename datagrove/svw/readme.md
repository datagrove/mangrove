https://pub-30964ddfca8d42c2a054a44b14c9da25.r2.dev/test_dg_main/index.html

1. Client writes their web site into a database. 
2. Database is replicated onto a primary. Primary is probably on the internet, maybe interserver, or maybe just my mac for now.
3. When the client invokes a commit, the primary generates a static site and pushes it to the host. To use astro, we would probably run it in a 