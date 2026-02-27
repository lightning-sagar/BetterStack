use diesel::{ExpressionMethods, RunQueryDsl, Selectable, SelectableHelper, prelude::{Insertable, Queryable}, query_dsl::methods::{FilterDsl, SelectDsl}};
use uuid::Uuid;
use crate::{store::Store};
// diffeernce bw queryable and selectable is that queryable is used to map the result of a query to a struct, while selectable is used to define a struct that can be used in a select statement.
#[derive(Queryable, Selectable, Insertable, Debug)]
#[diesel(table_name = crate::schema::Website)]
#[diesel(check_for_backend(diesel::pg::Pg))]

pub struct Website{
    pub id: String,
    pub url: String,
    pub created_at: chrono::NaiveDateTime,
    pub user_id: String,
}

impl Store {
    
    pub fn create_website(&mut self, url:String, user_id:String)->Result<Website, diesel::result::Error>{
        let id = Uuid::new_v4();
        if url == "".to_string() || user_id == "".to_string(){
            return Err(diesel::result::Error::NotFound);
        }
            
        let is_user_exist = crate::schema::User::table
            .filter(crate::schema::User::id.eq(&user_id))
            .select(crate::schema::User::id)
            .first::<String>(&mut self.conn)
            .is_ok();
        if !is_user_exist {
            return Err(diesel::result::Error::NotFound);
        }
        let website = Website {
            id: id.to_string(),
            url: url.clone(),
            created_at: chrono::Utc::now().naive_utc(),
            user_id: user_id, 
        };
        let res: Website = diesel::insert_into(crate::schema::Website::table)
            .values(&website)
            .returning(Website::as_returning())// using as_returning to return the inserted website thanks to the selectable trait
            .get_result(&mut self.conn)?;
        Ok(res)
    }

    pub fn get_website(&mut self, user_id:String)->Result<Website, diesel::result::Error>{
        if user_id == "".to_string(){
            return Err(diesel::result::Error::NotFound);
        }

        let website:Website = crate::schema::Website::table
            .filter(crate::schema::Website::user_id.eq(user_id))
            .select(Website::as_select())
            .first::<Website>(&mut self.conn)?; // load vs first is that load returns a vector of results while first returns a single result

        Ok(website)
    }
}
