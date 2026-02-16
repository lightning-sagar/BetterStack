- use 
    docker run -p 5432:5432 -e POSTGRES_PASSWORD=postgres -d postgres
- save the env file with the creds
- run `diesel setup` for migration
- now we need to generate migration -> `diesel migration generate (add the name optinal)` => this will create "empty" sql file for u...

--- 
basic of docker

docker ps
CONTAINER ID   IMAGE                  COMMAND                  CREATED          STATUS          PORTS                                         NAMES
437aaea043d1   postgres

 docker exec -it 437aaea043d1 sh

---
postgres basic:
postgres=# psql -U postgres
postgres=# psql -U postgres  
postgres=# \dt;