CREATE TABLE users (
    id TEXT PRIMARY KEY, -- UUID
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth TEXT NOT NULL,
    avatar TEXT,
    nickname TEXT,
    about_me TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
