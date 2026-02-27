use crate::store::Store;
use argonautica::{Hasher, Verifier};
use diesel::{
    ExpressionMethods, RunQueryDsl, Selectable, SelectableHelper,
    prelude::{Insertable, Queryable},
    query_dsl::methods::{FilterDsl, SelectDsl},
};
use std::env;
use uuid::Uuid;
// diffeernce bw queryable and selectable is that queryable is used to map the result of a query to a struct, while selectable is used to define a struct that can be used in a select statement.
#[derive(Queryable, Selectable, Insertable, Debug)]
#[diesel(table_name = crate::schema::User)]
#[diesel(check_for_backend(diesel::pg::Pg))]

struct User {
    id: String,
    username: String,
    email: String,
    password: String,
    created_at: chrono::NaiveDateTime,
}

impl Store {
    pub fn sign_up(
        &mut self,
        username: String,
        password: String,
        email: String,
    ) -> Result<String, diesel::result::Error> {
        let id = Uuid::new_v4();
        if password.is_empty() || username.is_empty() || email.is_empty() {
            return Err(diesel::result::Error::NotFound);
        }
        let pass = Hasher::default()
            .with_password(password)
            .with_secret_key(
                env::var("SECRET_ARGONAUTICA")
                    .unwrap_or_else(|_| "pls provide the secret for ARGONAUTICA".to_string()),
            )
            .hash()
            .map_err(|_| diesel::result::Error::RollbackTransaction)?;
        let user = User {
            id: id.to_string(),
            username: username.clone(),
            email: email.clone(),
            password: pass.clone(),
            created_at: chrono::Utc::now().naive_utc(),
        };
        let res = diesel::insert_into(crate::schema::User::table)
            .values(&user)
            .returning(User::as_returning()) // using as_returning to return the inserted user thanks to the selectable trait
            .get_result(&mut self.conn)?;
        Ok(res.id.to_string())
    }

    pub fn sign_in(
        &mut self,
        username: String,
        password: String,
        _email: Option<String>,
    ) -> Result<String, diesel::result::Error> {
        if username == "".to_string() || password == "".to_string() {
            return Err(diesel::result::Error::NotFound);
        }
        let user: User = crate::schema::User::table
            .filter(crate::schema::User::username.eq(username))
            .select(User::as_select())
            .first::<User>(&mut self.conn)?; // load vs first is that load returns a vector of results while first returns a single result
        if user.id == "".to_string() {
            return Err(diesel::result::Error::NotFound);
        }
        let pass = Verifier::default()
            .with_hash(user.password)
            .with_password(password)
            .with_secret_key(
                env::var("SECRET_ARGONAUTICA")
                    .unwrap_or_else(|_| "pls provide the secret for ARGONAUTICA".to_string()),
            )
            .verify()
            .map_err(|_| diesel::result::Error::RollbackTransaction)?;
        if pass {
            return Ok(user.id);
        } else {
            return Err(diesel::result::Error::NotFound);
        }
    }
}
