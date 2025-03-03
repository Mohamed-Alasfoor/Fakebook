CREATE TABLE post_privacy (
    post_id TEXT NOT NULL,    -- The post ID this privacy setting applies to
    user_id TEXT NOT NULL,    -- The user ID who is allowed to view the post
    PRIMARY KEY (post_id, user_id), -- A composite primary key ensures uniqueness
    FOREIGN KEY (post_id) REFERENCES posts(id), -- Ensures post_id exists in posts
    FOREIGN KEY (user_id) REFERENCES users(id)  -- Ensures user_id exists in users
);
