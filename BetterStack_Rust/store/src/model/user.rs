use std::env;

use argonautica::{Hasher, Verifier};
use diesel::{Selectable, prelude::{Insertable, Queryable}};
use uuid::Uuid;
use crate::{model::user, store::Store};
// diffeernce bw queryable and selectable is that queryable is used to map the result of a query to a struct, while selectable is used to define a struct that can be used in a select statement.
#[derive(Queryable, Selectable, Insertable, Debug)]
#[diesel(table_name = crate::schema::User)]
#[diesel(check_for_backend(diesel::pg::Pg))]

struct User{
    id: String,
    username:String,
    email:String,
    password: String,
}

impl Store {
    
    pub fn sign_up(&self, username:String, password:String, email:String)->Result<String, diesel::result::Error>{
        let id = Uuid::new_v4();
        if(password == "".to_string() || username == "".to_string() || email == "".to_string()){
            return Err("Username, password and email cannot be empty".into());
        }
        let pass = Hasher::default()
            .with_password(password)
            .with_secret_key(env::var("SECRET_ARGONAUTICA").unwrap_or_else("pls provide the secret for ARGONAUTICA"))
            .hash()
            .unwrap();
        let user = User {
            id: id.to_string(),
            username: username.clone(),
            email: email.clone(),
            password: pass.clone(),
        };
        let res = diesel::insert_into(crate::schema::User::table)
            .values(&user)
            .returning(User::as_returning())// using as_returning to return the inserted user thanks to the selectable trait
            .get_result(&self.conn)
            .expect("Error inserting user");
        Ok(res.id.to_string())
    }

    pub fn sign_in(&self, username:String, password:String, email:Option<String>)->Result<bool, diesel::result::Error>{
        if(username == "".to_string() || password == "".to_string()){
            return Err("Username and password cannot be empty".into());
        }
        let user:User = create::User::table
            .filter(create::User::username.eq(username))
            .select(User::as_select())
            .first::<User>(&self.conn) // load vs first is that load returns a vector of results while first returns a single result
            .expect("Error loading user");
        if user.is_empty() {
            return Err("User not found".into());
        }
        let pass = Verifier::default()
            .with_hash(user.password)
            .with_password(password)
            .with_secret_key(env::var("SECRET_ARGONAUTICA").unwrap_or_else("pls provide the secret for ARGONAUTICA"))
            .verify()
            .unwrap();
        if(pass){
            return Ok(true);
        } else{
            return Ok(false);
        }
    }
}
