use redis_stream::config::Config;
use redis_rs::streams::StreamReadReply;
use redis_rs::AsyncCommands;

#[derive(Clone, Debug)]
pub struct WebsiteAdd {
    pub url: String,
    pub id: String,
}

#[derive(Clone, Debug)]
pub struct XreadType {
    pub id: String,
    pub message: WebsiteAdd,
}

pub struct Redis {
    pub conn: redis_rs::aio::MultiplexedConnection,
}

const STREAM_KEY: &str = "betteruptime:website";

impl Redis {
    pub async fn default() -> Result<Self, redis_rs::RedisError> {
        let client = redis_rs::Client::open(Config::default().redis_db_url)?;
        let conn = client.get_multiplexed_async_connection().await?;
        Ok(Self { conn })
    }

    async fn ensure_consumer_group(&mut self, consumer_group: &str) -> Result<(), redis_rs::RedisError> {
        let result: redis_rs::RedisResult<String> = redis_rs::cmd("XGROUP")
            .arg("CREATE")
            .arg(STREAM_KEY)
            .arg(consumer_group)
            .arg("0")
            .arg("MKSTREAM")
            .query_async(&mut self.conn)
            .await;

        match result {
            Ok(_) => {
                println!("Created consumer group '{}' on {}", consumer_group, STREAM_KEY);
                Ok(())
            }
            Err(error) if error.code() == Some("BUSYGROUP") || error.to_string().contains("BUSYGROUP") => Ok(()),
            Err(error) => Err(error),
        }
    }

    async fn xadd(&mut self, websites: &[WebsiteAdd]) -> Result<(), redis_rs::RedisError> {
        for website in websites {
            let _: String = self
                .conn
                .xadd(
                    STREAM_KEY,
                    "*",
                    &[("url", website.url.as_str()), ("id", website.id.as_str())],
                )
                .await?;
        }

        Ok(())
    }

    async fn bulk_xadd(&mut self, websites: &[WebsiteAdd]) -> Result<(), redis_rs::RedisError> {
        let mut pipe = redis_rs::pipe();

        for website in websites {
            pipe.cmd("XADD")
                .arg(STREAM_KEY)
                .arg("*")
                .arg("url")
                .arg(&website.url)
                .arg("id")
                .arg(&website.id);
        }

        let _: () = pipe.query_async(&mut self.conn).await?;
        Ok(())
    }

    async fn read_group_raw(
        &mut self,
        worker_id: &str,
        consumer_group: &str,
    ) -> Result<StreamReadReply, redis_rs::RedisError> {
        redis_rs::cmd("XREADGROUP")
            .arg("GROUP")
            .arg(consumer_group)
            .arg(worker_id)
            .arg("COUNT")
            .arg(10)
            .arg("BLOCK")
            .arg(5000)
            .arg("STREAMS")
            .arg(STREAM_KEY)
            .arg(">")
            .query_async(&mut self.conn)
            .await
    }

    async fn xread_group(
        &mut self,
        worker_id: &str,
        consumer_group: &str,
    ) -> Result<Vec<XreadType>, redis_rs::RedisError> {
        let reply = match self.read_group_raw(worker_id, consumer_group).await {
            Ok(reply) => reply,
            Err(error) if error.code() == Some("NOGROUP") || error.to_string().contains("NOGROUP") => {
                self.ensure_consumer_group(consumer_group).await?;
                self.read_group_raw(worker_id, consumer_group).await?
            }
            Err(error) => return Err(error),
        };

        let messages = parse_stream_read_reply(reply);
        println!("XReadGroup Result: {}", messages.len());
        Ok(messages)
    }

    async fn xack(&mut self, consumer_group: &str, stream_id: &str) -> Result<i64, redis_rs::RedisError> {
        let res = self.conn.xack(STREAM_KEY, consumer_group, &[stream_id]).await?;
        println!("XAck Result: {}", res);
        Ok(res)
    }

    async fn bulk_xack(&mut self, consumer_group: &str, stream_ids: &[String]) -> Result<i64, redis_rs::RedisError> {
        if stream_ids.is_empty() {
            return Ok(0);
        }

        let mut total_acked = 0;
        for stream_id in stream_ids {
            total_acked += self.xack(consumer_group, stream_id).await?;
        }

        println!("BulkXAck Result: {}", total_acked);
        Ok(total_acked)
    }
}

pub fn parse_stream_read_reply(reply: StreamReadReply) -> Vec<XreadType> {
    let mut messages = Vec::new();

    for stream_key in reply.keys {
        for stream_id in stream_key.ids {
            let url = stream_id.get::<String>("url").unwrap_or_default();
            let id = stream_id.get::<String>("id").unwrap_or_default();

            messages.push(XreadType {
                id: stream_id.id,
                message: WebsiteAdd { url, id },
            });
        }
    }

    messages
}

#[allow(non_snake_case)]
pub async fn connectRedis() -> Result<Redis, redis_rs::RedisError> {
    let redis = Redis::default().await?;
    println!("Redis connected");
    Ok(redis)
}

#[allow(non_snake_case)]
pub async fn XAdd(redis: &mut Redis, websites: &[WebsiteAdd]) -> Result<(), redis_rs::RedisError> {
    redis.xadd(websites).await
}

#[allow(non_snake_case)]
pub async fn BulkXAdd(redis: &mut Redis, websites: &[WebsiteAdd]) -> Result<(), redis_rs::RedisError> {
    redis.bulk_xadd(websites).await
}

#[allow(non_snake_case)]
pub async fn XReadGroup(
    redis: &mut Redis,
    worker_id: &str,
    consumer_group: &str,
) -> Result<Vec<XreadType>, redis_rs::RedisError> {
    redis.xread_group(worker_id, consumer_group).await
}

#[allow(non_snake_case)]
pub async fn XAck(
    redis: &mut Redis,
    consumer_group: &str,
    stream_id: &str,
) -> Result<i64, redis_rs::RedisError> {
    redis.xack(consumer_group, stream_id).await
}

#[allow(non_snake_case)]
pub async fn BulkXAck(
    redis: &mut Redis,
    consumer_group: &str,
    stream_ids: &[String],
) -> Result<i64, redis_rs::RedisError> {
    redis.bulk_xack(consumer_group, stream_ids).await
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::dotenv().ok();

    let mut redis = connectRedis().await?;
    let websites = vec![WebsiteAdd {
        url: "https://example.com".to_string(),
        id: "1234".to_string(),
    }];

    BulkXAdd(&mut redis, &websites).await?;
    println!("Redis connection initialized");
    Ok(())
}
