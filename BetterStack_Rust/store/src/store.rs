use diesel::{Connection, ConnectionError, PgConnection, QueryDsl, RunQueryDsl, SelectableHelper};

use crate::config::Config;
use crate::model::website::Website;
use crate::schema::Website as WebsiteTable;

pub struct Store {
    pub conn: PgConnection,
}

impl Store {
    pub fn default() -> Result<Self, ConnectionError> {
        let config:Config = Config::default();
        let connection = PgConnection::establish(&config.db_url)?;
        Ok(Self{
            conn:connection 
        })
    }

    pub fn get_websites(&mut self) -> Result<Vec<Website>, diesel::result::Error> {
        WebsiteTable::table
            .select(Website::as_select())
            .load::<Website>(&mut self.conn)
    }
}