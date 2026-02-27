use std::sync::{Arc, Mutex};

use poem::{handler, web::{Data, Json}};

use crate::{
	req_input::{SignInInput, SignUpInput},
	req_output::{SignInOutput, SignUpOutput},
};
use store::store::Store;

#[handler]
pub async fn signup(data: Json<SignUpInput>, s: Data<&Arc<Mutex<Store>>>) -> Json<SignUpOutput> {
	let mut locked_store = s.lock().unwrap_or_else(|poisoned| poisoned.into_inner());
	match locked_store.sign_up(data.username.clone(), data.password.clone(), data.email.clone()) {
		Ok(res) => Json(SignUpOutput {
			message: format!("Sign up successful: {}", res),
			success: true,
		}),
		Err(err) => Json(SignUpOutput {
			message: format!("Sign up failed: {}", err),
			success: false,
		}),
	}
}

#[handler]
pub async fn sign_in(data: Json<SignInInput>, s: Data<&Arc<Mutex<Store>>>) -> Json<SignInOutput> {
	let mut locked_store = s.lock().unwrap_or_else(|poisoned| poisoned.into_inner());
	match locked_store.sign_in(data.username.clone(), data.password.clone(), data.email.clone()) {
		Ok(res) => Json(SignInOutput {
			message: format!("Sign in successful: {}", res),
			success: true,
		}),
		Err(err) => Json(SignInOutput {
			message: format!("Sign in failed: {}", err),
			success: false,
		}),
	}
}
