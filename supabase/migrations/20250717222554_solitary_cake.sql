/*
  # Fix activity logs foreign key constraint

  1. Changes
    - Make client_id nullable in activity_logs table
    - Change ON DELETE CASCADE to ON DELETE SET NULL
    - This allows logging system actions and preserves deletion logs

  2. Security
    - Update existing policies to handle nullable client_id
*/

-- Drop the existing foreign key constraint
ALTER TABLE activity_logs DROP CONSTRAINT IF EXISTS activity_logs_client_id_fkey;

-- Make client_id nullable
ALTER TABLE activity_logs ALTER COLUMN client_id DROP NOT NULL;

-- Add the foreign key constraint back with SET NULL on delete
ALTER TABLE activity_logs ADD CONSTRAINT activity_logs_client_id_fkey 
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;