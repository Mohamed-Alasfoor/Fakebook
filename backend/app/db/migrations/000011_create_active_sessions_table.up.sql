-- 000011_create_active_sessions_table.up.sql
-- Migration to create the `active_sessions` table

CREATE TABLE active_sessions (
    session_id TEXT PRIMARY KEY,          -- Unique identifier for the session
    user_id TEXT NOT NULL,                -- ID of the user associated with the session
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,  -- Timestamp when the session was created
    expires_at DATETIME NOT NULL,         -- When the session will expire
    FOREIGN KEY (user_id) REFERENCES users(id)      -- Reference to the users table
);
