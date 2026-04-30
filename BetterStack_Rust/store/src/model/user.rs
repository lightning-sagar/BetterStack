use crate::store::Store;
use argon2::{
    Argon2, PasswordHash, PasswordHasher, PasswordVerifier,
    password_hash::{SaltString, rand_core::OsRng},
};
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

#[derive(Clone, Debug)]
pub struct PublicUser {
    pub id: String,
    pub username: String,
    pub email: String,
}

fn to_public_user(user: User) -> PublicUser {
    PublicUser {
        id: user.id,
        username: user.username,
        email: user.email,
    }
}

fn password_secret() -> String {
    env::var("SECRET_ARGON2")
        .or_else(|_| env::var("SECRET_ARGONAUTICA"))
        .unwrap_or_else(|_| "pls provide the secret for ARGON2".to_string())
}

fn password_input(password: &str) -> Vec<u8> {
    let secret = password_secret();
    let mut input = Vec::with_capacity(secret.len() + password.len() + 1);
    input.extend_from_slice(secret.as_bytes());
    input.push(b':');
    input.extend_from_slice(password.as_bytes());
    input
}

fn hash_password(password: &str) -> Result<String, argon2::password_hash::Error> {
    let salt = SaltString::generate(&mut OsRng);
    let input = password_input(password);
    Ok(Argon2::default()
        .hash_password(&input, &salt)?
        .to_string())
}

fn verify_password(password: &str, hash: &str) -> Result<bool, argon2::password_hash::Error> {
    let parsed_hash = PasswordHash::new(hash)?;
    let input = password_input(password);
    Ok(Argon2::default()
        .verify_password(&input, &parsed_hash)
        .is_ok())
}

impl Store {
    pub fn sign_up(
        &mut self,
        username: String,
        email: String,
        password: String,
    ) -> Result<PublicUser, diesel::result::Error> {
        let id = Uuid::new_v4();
        if password.is_empty() || email.is_empty() || username.is_empty() {
            return Err(diesel::result::Error::NotFound);
        }
        let pass = hash_password(&password)
            .map_err(|_| diesel::result::Error::RollbackTransaction)?;
        let user = User {
            id: id.to_string(),
            username,
            email: email.clone(),
            password: pass,
            created_at: chrono::Utc::now().naive_utc(),
        };
        let res = diesel::insert_into(crate::schema::User::table)
            .values(&user)
            .returning(User::as_returning()) // using as_returning to return the inserted user thanks to the selectable trait
            .get_result(&mut self.conn)?;
        Ok(to_public_user(res))
    }

    pub fn sign_in(
        &mut self,
        email: String,
        password: String,
    ) -> Result<PublicUser, diesel::result::Error> {
	    if email == "".to_string() || password == "".to_string() {
            return Err(diesel::result::Error::NotFound);
        }
        let user: User = crate::schema::User::table
            .filter(crate::schema::User::email.eq(email))
            .select(User::as_select())
            .first::<User>(&mut self.conn)?; // load vs first is that load returns a vector of results while first returns a single result
        if user.id == "".to_string() {
            return Err(diesel::result::Error::NotFound);
        }
        let pass = verify_password(&password, &user.password)
            .map_err(|_| diesel::result::Error::RollbackTransaction)?;
        if pass {
            return Ok(to_public_user(user));
        } else {
            return Err(diesel::result::Error::NotFound);
        }
    }

    pub fn get_user_by_id(&mut self, user_id: String) -> Result<PublicUser, diesel::result::Error> {
        if user_id.is_empty() {
            return Err(diesel::result::Error::NotFound);
        }

        let user: User = crate::schema::User::table
            .filter(crate::schema::User::id.eq(user_id))
            .select(User::as_select())
            .first::<User>(&mut self.conn)?;

        Ok(to_public_user(user))
    }

    pub fn update_username(
        &mut self,
        user_id: String,
        username: String,
    ) -> Result<PublicUser, diesel::result::Error> {
        if user_id.is_empty() || username.trim().len() < 2 {
            return Err(diesel::result::Error::NotFound);
        }

        let updated: User = diesel::update(crate::schema::User::table.filter(crate::schema::User::id.eq(user_id)))
            .set(crate::schema::User::username.eq(username.trim().to_string()))
            .returning(User::as_returning())
            .get_result(&mut self.conn)?;

        Ok(to_public_user(updated))
    }

    pub fn update_profile(
        &mut self,
        user_id: String,
        username: Option<String>,
        email: Option<String>,
        password: Option<String>,
    ) -> Result<PublicUser, diesel::result::Error> {
        if user_id.is_empty() {
            return Err(diesel::result::Error::NotFound);
        }

        if let Some(username) = username {
            if !username.trim().is_empty() {
                diesel::update(crate::schema::User::table.filter(crate::schema::User::id.eq(&user_id)))
                    .set(crate::schema::User::username.eq(username.trim().to_string()))
                    .execute(&mut self.conn)?;
            }
        }

        if let Some(email) = email {
            if !email.trim().is_empty() {
                diesel::update(crate::schema::User::table.filter(crate::schema::User::id.eq(&user_id)))
                    .set(crate::schema::User::email.eq(email.trim().to_string()))
                    .execute(&mut self.conn)?;
            }
        }

        if let Some(password) = password {
            if !password.is_empty() {
                let pass = hash_password(&password)
                    .map_err(|_| diesel::result::Error::RollbackTransaction)?;

                diesel::update(crate::schema::User::table.filter(crate::schema::User::id.eq(&user_id)))
                    .set(crate::schema::User::password.eq(pass))
                    .execute(&mut self.conn)?;
            }
        }

        self.get_user_by_id(user_id)
    }
}
