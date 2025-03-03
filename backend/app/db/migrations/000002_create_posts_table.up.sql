CREATE TABLE posts (
    id TEXT PRIMARY KEY,           -- UUID for the post
    user_id TEXT NOT NULL,         -- User who created the post
    content TEXT NOT NULL,         -- Post content
    image_url TEXT,                -- Optional image or GIF
    privacy TEXT DEFAULT 'public', -- Privacy level: public, private, almost_private
    likes_count INTEGER DEFAULT 0, -- Number of likes
    comments_count INTEGER DEFAULT 0, -- Number of comments
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
