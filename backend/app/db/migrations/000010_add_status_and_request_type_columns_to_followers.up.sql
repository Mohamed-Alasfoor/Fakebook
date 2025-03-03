-- Migration to add "status" and "request_type" columns to the "followers" table
ALTER TABLE followers ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE followers ADD COLUMN request_type TEXT NOT NULL DEFAULT 'manual';

-- Ensure existing rows have the default values
UPDATE followers SET status = 'pending' WHERE status IS NULL;
UPDATE followers SET request_type = 'manual' WHERE request_type IS NULL;
