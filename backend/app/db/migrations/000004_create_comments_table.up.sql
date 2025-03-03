CREATE TABLE comments (
    id TEXT PRIMARY KEY,           -- UUID for the comment
    post_id TEXT NOT NULL,         -- Associated post
    user_id TEXT NOT NULL,         -- User who commented
    content TEXT NOT NULL,         -- Comment content
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
