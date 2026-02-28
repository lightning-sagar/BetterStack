docker run -d -p 2739:2739 redis

docker ps

docker exec -it bc82ad0b0bec sh

 `> redis-cli`

---

basic
- 127.0.0.1:6379> HSET user name sagar
(integer) 1
- 127.0.0.1:6379> HGET user name
"sagar"

---

Stream
- 127.0.0.1:6379> XADD betteruptime:website * id 1 url google.com
"1772233272896-0"
- 127.0.0.1:6379> XREAD COUNT 10 BLOCK 500 STREAMS betteruptime:website 0
    1) 1) "betteruptime:website"
    2) 1) 1) "1772232597295-0"
            2) 1) "id"
                2) "1"
                3) "url"
                4) "google.com"


---

Consumer Group

XGROUP CREATE bettertimeup:website india $
XGROUP CREATE bettertimeup:website usa $

-> push something in the group

XADD bettertimeup:website * id 1 url facebook.com    

-> let read the value

XREADGROUP GROUP india  indai-1 COUNT 10 STREAMS bettertimeup:website >


