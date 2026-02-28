import { createClient } from "redis";

const client = await createClient({
    url: "redis://default:redispw@localhost:6379",
})
.on("error", (err) => console.log("Redis Client Error", err))
.connect();

await client.xAdd("betteruptime:website", "*", { id: "1", url: "goo.com" });
const res = await client.xRead({
    key: "bettertimeup:website",
    id: "0",
});
console.log(res);
client.destroy();