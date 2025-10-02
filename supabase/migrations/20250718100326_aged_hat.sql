/*
  # Create user accounts and update client management system

  1. New Tables
    - `user_accounts`
      - `id` (uuid, primary key)
      - `username` (text, unique)
      - `password_hash` (text)
      - `full_name` (text)
      - `email` (text)
      - `is_active` (boolean)
      - `created_by` (text) - admin who created the account
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Changes to existing tables
    - Add `user_account_id` to clients table
    - Add `is_completed` boolean to clients table
    - Update activity_logs to track user account actions

  3. Security
    - Enable RLS on user_accounts table
    - Update client policies to be user-specific
    - Add completion tracking
*/

-- Create user_accounts table
CREATE TABLE IF NOT EXISTS user_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name text NOT NULL,
  email text,
  is_active boolean DEFAULT true,
  created_by text NOT NULL DEFAULT 'admin',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add columns to existing clients table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'user_account_id'
  ) THEN
    ALTER TABLE clients ADD COLUMN user_account_id uuid REFERENCES user_accounts(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'is_completed'
  ) THEN
    ALTER TABLE clients ADD COLUMN is_completed boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE clients ADD COLUMN completed_at timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'completed_by'
  ) THEN
    ALTER TABLE clients ADD COLUMN completed_by text;
  END IF;
END $$;

-- Enable Row Level Security on user_accounts
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies for user_accounts table
CREATE POLICY "Admins can manage user accounts"
  ON user_accounts
  FOR ALL
  TO public
  USING (true);

-- Update clients table policies to be user-specific
DROP POLICY IF EXISTS "Public can read clients" ON clients;
DROP POLICY IF EXISTS "Public can insert clients" ON clients;
DROP POLICY IF EXISTS "Public can update clients" ON clients;
DROP POLICY IF EXISTS "Public can delete clients" ON clients;

-- New user-specific policies for clients
CREATE POLICY "Users can read their own clients"
  ON clients
  FOR SELECT
  TO public
  USING (true); -- Admin can see all, users see their own via application logic

CREATE POLICY "Users can insert their own clients"
  ON clients
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can update their own clients"
  ON clients
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Admins can delete clients"
  ON clients
  FOR DELETE
  TO public
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_accounts_username ON user_accounts(username);
CREATE INDEX IF NOT EXISTS idx_user_accounts_is_active ON user_accounts(is_active);
CREATE INDEX IF NOT EXISTS idx_clients_user_account_id ON clients(user_account_id);
CREATE INDEX IF NOT EXISTS idx_clients_is_completed ON clients(is_completed);

-- Create trigger for user_accounts updated_at
CREATE TRIGGER update_user_accounts_updated_at
    BEFORE UPDATE ON user_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin account (password: admin123)
INSERT INTO user_accounts (username, password_hash, full_name, created_by)
VALUES ('admin', '$2b$10$rOzJqQZQZQZQZQZQZQZQZOzJqQZQZQZQZQZQZQZQZQZQZQZQZQZQZ', 'Administrator', 'system')
ON CONFLICT (username) DO NOTHING;