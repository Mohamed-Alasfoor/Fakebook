-- Trigger to increment likes_count after a like is added
CREATE TRIGGER increment_likes_count
AFTER INSERT ON likes
FOR EACH ROW
BEGIN
    UPDATE posts
    SET likes_count = likes_count + 1
    WHERE id = NEW.post_id;
END;

-- Trigger to decrement likes_count after a like is removed
CREATE TRIGGER decrement_likes_count
AFTER DELETE ON likes
FOR EACH ROW
BEGIN
    UPDATE posts
    SET likes_count = likes_count - 1
    WHERE id = OLD.post_id;
END;

-- Trigger to increment comments_count after a comment is added
CREATE TRIGGER increment_comments_count
AFTER INSERT ON comments
FOR EACH ROW
BEGIN
    UPDATE posts
    SET comments_count = comments_count + 1
    WHERE id = NEW.post_id;
END;

-- Trigger to decrement comments_count after a comment is removed
CREATE TRIGGER decrement_comments_count
AFTER DELETE ON comments
FOR EACH ROW
BEGIN
    UPDATE posts
    SET comments_count = comments_count - 1
    WHERE id = OLD.post_id;
END;
