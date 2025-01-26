CREATE TABLE notifications (
    id TEXT PRIMARY KEY, -- UUID for each notification
    user_id TEXT NOT NULL, -- User receiving the notification
    type TEXT NOT NULL, -- Type of notification (e.g., "like", "comment", "follow_request", etc.)
    content TEXT NOT NULL, -- Description/message of the notification
    post_id TEXT, -- Optional: Related post ID (for likes/comments)
    related_user_id TEXT, -- Optional: User who triggered the notification (e.g., sender of a follow request)
    group_id TEXT, -- Optional: Related group ID (for group notifications)
    event_id TEXT, -- Optional: Related event ID (for group events)
    read BOOLEAN DEFAULT FALSE, -- Whether the notification has been read
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- When the notification was created
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (post_id) REFERENCES posts(id)
);
