use diesel::Connection;

pub struct Store {
    conn: Connection,
}



impl Store {
    pub fn create_user(&self) ->(){

    }
    pub fn create_website(&self) ->String{
        format!("1")
    }
    pub fn get_user(&self) ->(){

    }
    pub fn get_website(&self) ->(){

    }
}
