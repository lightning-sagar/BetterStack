* Setup the DB
    * cd Store
    * disiel setup

* Run Rust/api
    * cargo run

* Run FE

* To Run Worker:
```bash    
REGION_NAME=india WORKER_ID=india-1 cargo run -p worker
```

* To Run Pusher:
```bash
cargo run pusher
```

---

to run the stepup
- FE
```bash
cd apps/my-app/ 
npm run dev
```

- api
```bash
cd api
cargo run
```

- pusher
```bash
cd pusher
cargo run
```