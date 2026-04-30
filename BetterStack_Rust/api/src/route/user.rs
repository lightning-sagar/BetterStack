use std::sync::{Arc, Mutex};

use poem::{handler, web::{Data, Json}};

use crate::{
	middleware::AuthUser,
	req_input::{SignInInput, SignUpInput, UpdateProfileInput, UpdateUsernameInput},
	req_output::{LogoutOutput, MeOutput, SignInOutput, SignUpOutput, UpdateUserOutput, User},
};
use store::store::Store;

fn to_api_user(user: store::model::user::PublicUser) -> User {
	User {
		id: user.id,
		username: user.username,
		email: user.email,
	}
}

#[handler]
pub async fn signup(data: Json<SignUpInput>, s: Data<&Arc<Mutex<Store>>>) -> Json<SignUpOutput> {
	let mut locked_store = s.lock().unwrap_or_else(|poisoned| poisoned.into_inner());
	let username = format!("{} {}", data.first_name.trim(), data.last_name.trim())
		.split_whitespace()
		.collect::<Vec<_>>()
		.join(" ");

	match locked_store.sign_up(username, data.email.clone(), data.password.clone()) {
		Ok(res) => Json(SignUpOutput {
			message: format!("Sign up successful: {}", res.id),
			success: true,
			token: res.id.clone(),
			user: to_api_user(res),
		}),
		Err(err) => Json(SignUpOutput {
			message: format!("Sign up failed: {}", err),
			success: false,
			token: "".to_string(),
			user: User {
				id: "".to_string(),
				username: "".to_string(),
				email: "".to_string(),
			}
		}),
	}
}

#[handler]
pub async fn sign_in(data: Json<SignInInput>, s: Data<&Arc<Mutex<Store>>>) -> Json<SignInOutput> {
	let mut locked_store = s.lock().unwrap_or_else(|poisoned| poisoned.into_inner());
	match locked_store.sign_in(data.email.clone(), data.password.clone()) {
		Ok(res) => Json(SignInOutput {
			message: format!("Sign in successful: {}", res.id),
			success: true,
			token: res.id.clone(),
			user: to_api_user(res),
		}),
		Err(err) => Json(SignInOutput {
			message: format!("Sign in failed: {}", err),
			success: false,
			token: "".to_string(),
			user: User {
				id: "".to_string(),
				username: "".to_string(),
				email: "".to_string(),
			}
		}),
	}
}

#[handler]
pub async fn me(auth_user: Data<&AuthUser>, s: Data<&Arc<Mutex<Store>>>) -> Json<MeOutput> {
	let mut locked_store = s.lock().unwrap_or_else(|poisoned| poisoned.into_inner());
	match locked_store.get_user_by_id(auth_user.user_id.clone()) {
		Ok(user) => Json(MeOutput {
			success: true,
			user: to_api_user(user),
		}),
		Err(_) => Json(MeOutput {
			success: false,
			user: User {
				id: "".to_string(),
				username: "".to_string(),
				email: "".to_string(),
			},
		}),
	}
}

#[handler]
pub async fn logout() -> Json<LogoutOutput> {
	Json(LogoutOutput {
		message: "Logout successful".to_string(),
		success: true,
	})
}

#[handler]
pub async fn update_username(
	auth_user: Data<&AuthUser>,
	data: Json<UpdateUsernameInput>,
	s: Data<&Arc<Mutex<Store>>>,
) -> Json<UpdateUserOutput> {
	let mut locked_store = s.lock().unwrap_or_else(|poisoned| poisoned.into_inner());
	match locked_store.update_username(auth_user.user_id.clone(), data.username.clone()) {
		Ok(user) => Json(UpdateUserOutput {
			message: "Username updated".to_string(),
			success: true,
			token: user.id.clone(),
			user: to_api_user(user),
		}),
		Err(err) => Json(UpdateUserOutput {
			message: format!("Failed to update username: {}", err),
			success: false,
			token: "".to_string(),
			user: User {
				id: "".to_string(),
				username: "".to_string(),
				email: "".to_string(),
			},
		}),
	}
}

#[handler]
pub async fn update_profile(
	auth_user: Data<&AuthUser>,
	data: Json<UpdateProfileInput>,
	s: Data<&Arc<Mutex<Store>>>,
) -> Json<UpdateUserOutput> {
	let mut locked_store = s.lock().unwrap_or_else(|poisoned| poisoned.into_inner());
	match locked_store.update_profile(
		auth_user.user_id.clone(),
		data.username.clone(),
		data.email.clone(),
		data.password.clone(),
	) {
		Ok(user) => Json(UpdateUserOutput {
			message: "Profile updated".to_string(),
			success: true,
			token: user.id.clone(),
			user: to_api_user(user),
		}),
		Err(err) => Json(UpdateUserOutput {
			message: format!("Failed to update profile: {}", err),
			success: false,
			token: "".to_string(),
			user: User {
				id: "".to_string(),
				username: "".to_string(),
				email: "".to_string(),
			},
		}),
	}
}
