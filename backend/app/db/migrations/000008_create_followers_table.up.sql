CREATE TABLE followers (
    id TEXT PRIMARY KEY,              -- UUID for the relationship
    follower_id TEXT NOT NULL,        -- User who is following
    followed_id TEXT NOT NULL,        -- User being followed
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (followed_id) REFERENCES users(id) ON DELETE CASCADE
);
