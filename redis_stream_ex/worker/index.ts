import {createClient} from "redis";

const client = await createClient({
    url: "redis://default:redispw@localhost:6379",
})
.on("error",(err)=> console.log("Redis Client Error", err))
.connect();

const res = await client.xReadGroup("india", "india-1",{
    key: "bettertimeup:website",
    id: ">"
},{
    COUNT: 2,
    BLOCK: 5000
})

// @ts-ignore
console.log(res[0].messages);
client.destroy();