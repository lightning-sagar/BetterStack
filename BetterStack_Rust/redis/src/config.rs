use std::env;

pub struct Config {
    pub redis_db_url: String,
}

impl Default for Config {
    fn default() -> Self {
        let redis_db_url = env::var("REDIS_URL")
            .or_else(|_| env::var("REDIS_DB_URL"))
            .unwrap_or_else(|_| panic!("Pls provide Redis db url"));
        Self { redis_db_url }
    }
}