-- Migration to remove the "private" column from the "users" table
ALTER TABLE users DROP COLUMN private;
