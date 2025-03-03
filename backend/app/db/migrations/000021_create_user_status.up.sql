-- 000004_create_user_status.up.sql
CREATE TABLE IF NOT EXISTS user_status (
    user_id TEXT PRIMARY KEY,
    status TEXT NOT NULL, -- values: 'online' or 'offline'
    last_seen DATETIME
);
