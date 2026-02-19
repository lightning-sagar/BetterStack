// @generated automatically by Diesel CLI.

pub mod sql_types {
    #[derive(diesel::query_builder::QueryId, Clone, diesel::sql_types::SqlType)]
    #[diesel(postgres_type(name = "StatusCode"))]
    pub struct StatusCode;
}

diesel::table! {
    Region (id) {
        id -> Text,
        name -> Text,
    }
}

diesel::table! {
    User (id) {
        id -> Text,
        username -> Text,
        email -> Text,
        password -> Text,
        created_at -> Timestamp,
    }
}

diesel::table! {
    Website (id) {
        id -> Text,
        url -> Text,
        created_at -> Timestamp,
        user_id -> Text,
    }
}

diesel::table! {
    use diesel::sql_types::*;
    use super::sql_types::StatusCode;

    WebsiteTick (id) {
        id -> Text,
        response_time_ms -> Int4,
        status_code -> StatusCode,
        time_checked -> Timestamp,
        region_id -> Text,
        website_id -> Text,
    }
}

diesel::joinable!(Website -> User (user_id));
diesel::joinable!(WebsiteTick -> Region (region_id));
diesel::joinable!(WebsiteTick -> Website (website_id));

diesel::allow_tables_to_appear_in_same_query!(Region, User, Website, WebsiteTick,);
