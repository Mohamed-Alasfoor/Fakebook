CREATE TABLE followers (
    id TEXT PRIMARY KEY,              -- UUID for the relationship
    follower_id TEXT NOT NULL,        -- User who is following
    followed_id TEXT NOT NULL,        -- User being followed
    status TEXT NOT NULL,             -- 'pending', 'accepted', 'declined'
    request_type TEXT NOT NULL,       -- 'auto' (public profile) or 'manual' (private profile)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (followed_id) REFERENCES users(id) ON DELETE CASCADE
);
