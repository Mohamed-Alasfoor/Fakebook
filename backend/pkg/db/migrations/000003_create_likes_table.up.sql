CREATE TABLE likes (
    id TEXT PRIMARY KEY,           -- UUID for the like
    post_id TEXT NOT NULL,         -- Associated post
    user_id TEXT NOT NULL,         -- User who liked the post
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
