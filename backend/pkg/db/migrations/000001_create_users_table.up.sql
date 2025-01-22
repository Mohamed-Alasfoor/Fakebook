CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    nickname TEXT UNIQUE,
    about_me TEXT,
    avatar TEXT,
    date_of_birth TEXT NOT NULL
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
