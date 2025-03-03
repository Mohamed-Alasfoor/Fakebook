-- Migration to add a "private" column to the "users" table
ALTER TABLE users ADD COLUMN private INTEGER DEFAULT 0;
